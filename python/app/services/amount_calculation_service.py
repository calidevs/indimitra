"""
Amount calculation service for server-side order total verification.

Replicates frontend getCartTotals() logic to ensure payment amounts are verified
server-side. Never trust client-calculated amounts for payments.

Frontend reference: js/src/store/useStore.js - getCartTotals()
"""
from typing import List, Optional
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.models.inventory import InventoryModel
from app.db.models.fees import FeesModel
from app.db.models.store import StoreModel


class AmountMismatchError(Exception):
    """Raised when client amount doesn't match server calculation."""
    def __init__(
        self,
        message: str,
        client_amount: float,
        server_amount: float,
        difference: float
    ):
        self.message = message
        self.client_amount = client_amount
        self.server_amount = server_amount
        self.difference = difference
        super().__init__(self.message)


def calculate_order_amount(
    store_id: int,
    product_items: List[dict],
    delivery_type: str,
    tip_amount: float = 0.0,
    db: Optional[Session] = None
) -> dict:
    """
    Calculate order totals server-side.

    Replicates frontend getCartTotals() logic exactly to ensure amounts match.

    Args:
        store_id: ID of the store
        product_items: List of [{"product_id": int, "quantity": int}, ...]
        delivery_type: "pickup" or "delivery"
        tip_amount: Optional tip amount (passed through, not calculated)
        db: Optional database session (creates new if not provided)

    Returns:
        dict with:
            - subtotal: Sum of (price * quantity) for all items
            - delivery_fee: Fee based on store's fee tiers
            - tax_amount: Calculated from store's tax percentage
            - tip_amount: Passed through from input
            - total: subtotal + delivery_fee + tax_amount + tip_amount

    Raises:
        ValueError: If store not found or product not in inventory
    """
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        # 1. Get inventory prices for products
        # Frontend reference: cart.items.reduce((acc, item) => acc + item.price * item.quantity, 0)
        product_ids = [item["product_id"] for item in product_items]

        inventory_items = db.query(InventoryModel).filter(
            InventoryModel.storeId == store_id,
            InventoryModel.productId.in_(product_ids)
        ).all()

        # Build lookup dict
        inventory_dict = {inv.productId: inv for inv in inventory_items}

        # Verify all products exist in inventory
        for item in product_items:
            if item["product_id"] not in inventory_dict:
                raise ValueError(
                    f"Product ID {item['product_id']} not found in store {store_id} inventory"
                )

        # 2. Calculate subtotal
        # Frontend reference: getCartTotals() subtotal calculation
        subtotal = 0.0
        for item in product_items:
            inventory = inventory_dict[item["product_id"]]
            subtotal += inventory.price * item["quantity"]

        # Round to 2 decimal places (matches frontend toFixed(2) pattern)
        subtotal = round(subtotal, 2)

        # 3. Get store for tax percentage
        store = db.query(StoreModel).filter(StoreModel.id == store_id).first()
        if not store:
            raise ValueError(f"Store ID {store_id} not found")

        # 4. Get delivery fee based on fee tiers
        # Frontend reference: fees.sort((a,b) => a.limit - b.limit), find first where subtotal <= limit
        delivery_fee = 0.0
        if delivery_type.upper() in ["DELIVERY", "PICKUP"]:
            fees = db.query(FeesModel).filter(
                FeesModel.store_id == store_id,
                FeesModel.type == delivery_type.upper()
            ).all()

            if fees:
                # Sort by limit (None/null limits go last - they're the "above X" tier)
                # Frontend reference: fees.sort((a,b) => a.limit - b.limit)
                sorted_fees = sorted(
                    fees,
                    key=lambda f: f.limit if f.limit is not None else float('inf')
                )

                # Find first matching tier (where subtotal <= limit)
                # Frontend reference: fees.find(f => subtotal <= f.limit)
                for fee in sorted_fees:
                    if fee.limit is None or subtotal <= fee.limit:
                        delivery_fee = fee.fee_rate
                        break

        delivery_fee = round(delivery_fee, 2)

        # 5. Calculate tax
        # Frontend reference: subtotal * (store.taxPercentage / 100)
        tax_rate = (store.taxPercentage or 0) / 100
        tax_amount = round(subtotal * tax_rate, 2)

        # 6. Calculate total
        # Frontend reference: subtotal + deliveryFee + tax + tip
        tip = round(tip_amount, 2) if tip_amount else 0.0
        total = round(subtotal + delivery_fee + tax_amount + tip, 2)

        return {
            "subtotal": subtotal,
            "delivery_fee": delivery_fee,
            "tax_amount": tax_amount,
            "tip_amount": tip,
            "total": total
        }

    finally:
        if close_db:
            db.close()


def verify_amounts_match(
    client_amount: float,
    server_amount: float,
    tolerance: float = 0.01
) -> bool:
    """
    Verify client-calculated amount matches server calculation.

    Args:
        client_amount: Amount calculated by frontend
        server_amount: Amount calculated by server
        tolerance: Maximum allowed difference (default $0.01)

    Returns:
        True if amounts match within tolerance

    Raises:
        AmountMismatchError: If difference exceeds tolerance
    """
    difference = abs(client_amount - server_amount)

    if difference > tolerance:
        raise AmountMismatchError(
            message=f"Amount mismatch: client sent ${client_amount:.2f}, server calculated ${server_amount:.2f}. "
                    f"Difference: ${difference:.2f} exceeds tolerance of ${tolerance:.2f}",
            client_amount=client_amount,
            server_amount=server_amount,
            difference=difference
        )

    return True


def calculate_amount_cents(amount_dollars: float) -> int:
    """
    Convert dollar amount to cents for Square API.

    Args:
        amount_dollars: Amount in dollars (e.g., 25.50)

    Returns:
        Amount in cents as integer (e.g., 2550)
    """
    return int(round(amount_dollars * 100))
