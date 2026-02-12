"""
Payment reconciliation service for recovering orphaned payments.

An orphaned payment occurs when:
1. Square payment succeeds
2. Database transaction to create PaymentModel + OrderModel fails
3. Customer is charged but has no order record

This service allows admins to:
1. Find orphaned payments by querying Square
2. Create the missing order from the logged order_params

Usage (admin/CLI):
    from app.services.payment_reconciliation_service import reconcile_payment
    reconcile_payment(idempotency_key="...", order_params={...})
"""
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timedelta

from app.services.payment_service import get_square_client, PaymentError
from app.db.session import SessionLocal
from app.db.models.payment import PaymentModel, PaymentType, PaymentStatus
from app.db.models.order import OrderModel, OrderStatus
from app.db.models.order_item import OrderItemModel
from app.db.models.inventory import InventoryModel
from app.db.models.fees import FeeType

logger = logging.getLogger(__name__)


def find_payment_by_idempotency_key(idempotency_key: str) -> Optional[Dict[str, Any]]:
    """
    Query Square API to find a payment by idempotency key.

    Square payments can be queried by idempotency_key within 24 hours.
    After 24 hours, you must search by payment_id or other criteria.

    Args:
        idempotency_key: The idempotency key used for the original payment

    Returns:
        Payment details dict if found, None otherwise

    Raises:
        PaymentError: If Square API call fails
    """
    try:
        client = get_square_client()

        # Search for payments in last 24 hours with this idempotency key
        # Note: Square's search doesn't directly filter by idempotency_key,
        # so we search recent payments and filter client-side
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=24)

        response = client.payments.list_payments(
            begin_time=start_time.isoformat() + "Z",
            end_time=end_time.isoformat() + "Z",
            limit=100
        )

        if response.is_success():
            payments = response.body.get('payments', [])
            for payment in payments:
                # Match by idempotency key in reference_id (if we stored it there)
                # or by searching our own logs for the square_payment_id
                if payment.get('reference_id') == idempotency_key:
                    return {
                        "payment_id": payment['id'],
                        "status": payment['status'],
                        "amount_cents": payment['amount_money']['amount'],
                        "currency": payment['amount_money']['currency'],
                        "receipt_url": payment.get('receipt_url'),
                        "created_at": payment.get('created_at')
                    }

        return None

    except Exception as e:
        logger.error(f"Failed to find payment by idempotency key: {e}")
        raise PaymentError(
            message=f"Failed to query Square for payment: {str(e)}",
            code="RECONCILIATION_QUERY_FAILED"
        )


def check_payment_exists_locally(square_payment_id: str) -> bool:
    """
    Check if a PaymentModel with this square_payment_id already exists.

    Args:
        square_payment_id: Square's payment ID

    Returns:
        True if payment record exists, False otherwise
    """
    db = SessionLocal()
    try:
        existing = db.query(PaymentModel).filter(
            PaymentModel.square_payment_id == square_payment_id
        ).first()
        return existing is not None
    finally:
        db.close()


def reconcile_payment(
    square_payment_id: str,
    idempotency_key: str,
    order_params: Dict[str, Any],
    payment_status: str = "COMPLETED",
    receipt_url: Optional[str] = None
) -> OrderModel:
    """
    Create order and payment records for an orphaned Square payment.

    This should be called by an admin after verifying:
    1. The Square payment exists and is COMPLETED
    2. No local PaymentModel exists for this square_payment_id
    3. The order_params match what the customer ordered

    Args:
        square_payment_id: Square's payment ID
        idempotency_key: Original idempotency key
        order_params: Dict with order details (from logged ORPHANED_PAYMENT)
            Required keys: user_id, store_id, product_items, total_amount,
                          order_total_amount, pickup_or_delivery
            Optional keys: address_id, pickup_id, delivery_fee, tip_amount,
                          tax_amount, delivery_instructions, custom_order
        payment_status: Square payment status (default COMPLETED)
        receipt_url: Square receipt URL

    Returns:
        Created OrderModel

    Raises:
        ValueError: If payment already reconciled or params invalid
    """
    # Check not already reconciled
    if check_payment_exists_locally(square_payment_id):
        raise ValueError(
            f"Payment {square_payment_id} already exists locally. "
            "May have been reconciled or the original transaction succeeded."
        )

    db = SessionLocal()
    try:
        # Extract required params
        user_id = order_params["user_id"]
        store_id = order_params["store_id"]
        product_items = order_params["product_items"]
        total_amount = order_params["total_amount"]
        order_total_amount = order_params["order_total_amount"]
        pickup_or_delivery = order_params["pickup_or_delivery"]

        # Create PaymentModel
        payment = PaymentModel(
            type=PaymentType.SQUARE,
            square_payment_id=square_payment_id,
            idempotency_key=idempotency_key,
            amount=round(order_total_amount, 2),
            currency="USD",
            status=PaymentStatus[payment_status] if payment_status in PaymentStatus.__members__ else PaymentStatus.COMPLETED,
            receipt_url=receipt_url
        )
        db.add(payment)
        db.flush()

        # Create OrderModel
        order = OrderModel(
            createdByUserId=user_id,
            addressId=order_params.get("address_id") if pickup_or_delivery == "delivery" else None,
            pickupId=order_params.get("pickup_id") if pickup_or_delivery == "pickup" else None,
            type=FeeType.DELIVERY if pickup_or_delivery == "delivery" else FeeType.PICKUP,
            storeId=store_id,
            status=OrderStatus.PENDING,
            paymentId=payment.id,
            totalAmount=total_amount,
            orderTotalAmount=order_total_amount,
            deliveryFee=order_params.get("delivery_fee"),
            tipAmount=order_params.get("tip_amount"),
            taxAmount=order_params.get("tax_amount"),
            deliveryDate=None,
            deliveryInstructions=order_params.get("delivery_instructions")
        )
        db.add(order)
        db.flush()

        # Set display code
        order.display_code = f"REC{order.id}{pickup_or_delivery[0].upper()}"  # REC prefix for reconciled
        order.custom_order = order_params.get("custom_order")

        # Create order items
        product_ids = [item["product_id"] for item in product_items]
        inventory_items = db.query(InventoryModel).filter(
            InventoryModel.storeId == store_id,
            InventoryModel.productId.in_(product_ids)
        ).all()
        inventory_dict = {item.productId: item for item in inventory_items}

        for item in product_items:
            if item["product_id"] not in inventory_dict:
                logger.warning(f"Product {item['product_id']} not in inventory during reconciliation")
                continue
            inventory_item = inventory_dict[item["product_id"]]
            order_item = OrderItemModel(
                productId=item["product_id"],
                quantity=item["quantity"],
                orderId=order.id,
                orderAmount=inventory_item.price * item["quantity"],
                inventoryId=inventory_item.id
            )
            db.add(order_item)

        db.commit()
        db.refresh(order)

        logger.info(
            f"Successfully reconciled orphaned payment. "
            f"square_payment_id={square_payment_id}, order_id={order.id}"
        )

        return order

    except Exception as e:
        db.rollback()
        logger.error(f"Failed to reconcile payment {square_payment_id}: {e}")
        raise
    finally:
        db.close()


def find_orphaned_payments(hours_back: int = 24) -> list:
    """
    Search logs for ORPHANED_PAYMENT entries that haven't been reconciled.

    This is a placeholder - actual implementation depends on logging infrastructure.
    In production, this would query CloudWatch/Datadog/etc for ORPHANED_PAYMENT logs.

    Args:
        hours_back: How many hours of logs to search

    Returns:
        List of orphaned payment records needing reconciliation
    """
    # TODO: Integrate with actual logging/monitoring system
    # For now, return empty list - admins should check logs manually
    logger.info(f"find_orphaned_payments called for last {hours_back} hours")
    return []
