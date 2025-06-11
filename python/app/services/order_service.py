from typing import List, Optional
from datetime import datetime

from app.db.session import SessionLocal
from app.db.models.order import OrderModel, OrderStatus
from app.db.models.order_item import OrderItemModel
from app.db.models.product import ProductModel
from app.db.models.address import AddressModel
from app.db.models.inventory import InventoryModel
from app.db.models.store_location_code import StoreLocationCodeModel
from app.db.models.pickup_address import PickupAddressModel
from app.db.models.fee_type import FeeType
from app.services.validation_service import validate_delivery_pincode

def get_order_by_id(order_id: int) -> Optional[OrderModel]:
    """Get an order by its ID"""
    db = SessionLocal()
    try:
        return db.query(OrderModel).filter(OrderModel.id == order_id).first()
    finally:
        db.close()

def get_orders_by_user(user_id: int) -> List[OrderModel]:
    """
    Get all orders for a specific user with their order items and product details
    
    This loads the complete order data needed for UI display, including:
    - Basic order information
    - All order items associated with each order
    - Product information for each order item
    """
    db = SessionLocal()
    try:
        # Use joinedload to eager load order items and their associated products
        from sqlalchemy.orm import joinedload
        
        orders = (
            db.query(OrderModel)
            .filter(OrderModel.createdByUserId == user_id)
            .options(
                joinedload(OrderModel.order_items).joinedload(OrderItemModel.product)
            )
            .all()
        )
        
        return orders
    finally:
        db.close()

def get_all_orders() -> List[OrderModel]:
    """Get all orders"""
    db = SessionLocal()
    try:
        return db.query(OrderModel).all()
    finally:
        db.close()

def get_orders_by_store(store_id: int) -> List[OrderModel]:
    """
    Get all orders for a specific store
    
    Args:
        store_id: The ID of the store to get orders for
        
    Returns:
        A list of orders for the specified store
    """
    db = SessionLocal()
    try:
        orders = db.query(OrderModel).filter(OrderModel.storeId == store_id).all()
        return orders
    finally:
        db.close()

def create_order(user_id: int, store_id: int, product_items: List[dict], 
                 total_amount: float, order_total_amount: float, 
                 pickup_or_delivery: str = "delivery",
                 address_id: Optional[int] = None,
                 pickup_id: Optional[int] = None,
                 delivery_fee: Optional[float] = None,
                 tip_amount: Optional[float] = None, 
                 tax_amount: Optional[float] = None,
                 delivery_instructions: Optional[str] = None,
                 custom_order: Optional[str] = None) -> OrderModel:
    """
    Create a new order with multiple order items
    
    Args:
        user_id: The ID of the user creating the order
        store_id: The ID of the store the order is being placed from
        product_items: List of product items [{"product_id": int, "quantity": int}, ...]
        total_amount: The total amount of products (subtotal)
        order_total_amount: The final total amount including all fees and taxes
        pickup_or_delivery: Type of order ("pickup" or "delivery")
        address_id: Optional delivery address ID (required for delivery)
        pickup_id: Optional pickup address ID (required for pickup)
        delivery_fee: Optional delivery fee
        tip_amount: Optional tip amount
        tax_amount: Optional tax amount
        delivery_instructions: Optional special instructions for delivery
        custom_order: Optional custom order instructions
    
    Returns:
        The created order
        
    Raises:
        ValueError: If pickup_or_delivery is not "pickup" or "delivery"
        ValueError: If required address/pickup ID is missing
    """
    if pickup_or_delivery not in ["pickup", "delivery"]:
        raise ValueError("pickup_or_delivery must be 'pickup' or 'delivery'")
        
    db = SessionLocal()
    try:
        # Handle address validation based on order type
        if pickup_or_delivery == "delivery":
            if not address_id:
                raise ValueError("Delivery address ID is required for delivery orders")
            
            # Verify the address exists and belongs to the user
            address = db.query(AddressModel).filter(
                AddressModel.id == address_id,
                AddressModel.userId == user_id
            ).first()
            
            if not address:
                raise ValueError(f"Address with ID {address_id} not found or does not belong to user {user_id}")
            
            # Validate delivery pincode is serviced by the store
            validate_delivery_pincode(address_id, store_id)
            
            # Extract city name from address and get location code
            location_code = "00"  # Default code
            if address.address:
                address_parts = address.address.split(',')
                if len(address_parts) >= 2:
                    city_name = address_parts[1].strip()
                    # Query StoreLocationCodeModel for the city code
                    location_code_record = db.query(StoreLocationCodeModel).filter(
                        StoreLocationCodeModel.store_id == store_id,
                        StoreLocationCodeModel.location == city_name
                    ).first()
                    if location_code_record:
                        location_code = location_code_record.code
        else:  # pickup
            if not pickup_id:
                raise ValueError("Pickup address ID is required for pickup orders")
            
            # Verify the pickup address exists and belongs to the store
            pickup_address = db.query(PickupAddressModel).filter(
                PickupAddressModel.id == pickup_id,
                PickupAddressModel.store_id == store_id
            ).first()
            
            if not pickup_address:
                raise ValueError(f"Pickup address with ID {pickup_id} not found or does not belong to store {store_id}")
            
            # Get location code for pickup address
            location_code = "00"  # Default code
            if pickup_address.address:
                address_parts = pickup_address.address.split(',')
                if len(address_parts) >= 2:
                    city_name = address_parts[1].strip()
                    # Query StoreLocationCodeModel for the city code
                    location_code_record = db.query(StoreLocationCodeModel).filter(
                        StoreLocationCodeModel.store_id == store_id,
                        StoreLocationCodeModel.location == city_name
                    ).first()
                    if location_code_record:
                        location_code = location_code_record.code
        
        # Extract all product IDs from the items
        product_ids = [item["product_id"] for item in product_items]
        
        # Fetch inventory items for the specific store and products
        inventory_items = db.query(InventoryModel).filter(
            InventoryModel.storeId == store_id,
            InventoryModel.productId.in_(product_ids)
        ).all()
        
        # Create dictionary for quick lookup
        inventory_dict = {item.productId: item for item in inventory_items}
        
        # Verify all products exist in store's inventory
        for item in product_items:
            if item["product_id"] not in inventory_dict:
                raise ValueError(f"Product with ID {item['product_id']} not found in store inventory")
        
        # Create the order with the provided amounts (no calculation in BE)
        order = OrderModel(
            createdByUserId=user_id,
            addressId=address_id if pickup_or_delivery == "delivery" else None,
            pickupId=pickup_id if pickup_or_delivery == "pickup" else None,
            type=FeeType.DELIVERY if pickup_or_delivery == "delivery" else FeeType.PICKUP,
            storeId=store_id,
            status=OrderStatus.PENDING,
            totalAmount=total_amount,
            orderTotalAmount=order_total_amount,
            deliveryFee=delivery_fee,
            tipAmount=tip_amount,
            taxAmount=tax_amount,
            deliveryDate=None,
            deliveryInstructions=delivery_instructions
        )
        
        db.add(order)
        db.flush()  # This will generate the order ID
        
        # Set display code and custom order
        order.display_code = f"{location_code}{order.id}{pickup_or_delivery[0].upper()}"
        order.custom_order = custom_order
        
        # Create order items with inventory prices
        for item in product_items:
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
        
        return order
    finally:
        db.close()

def update_order_status(order_id: int, status: str, delivery_instructions: Optional[str] = None) -> Optional[OrderModel]:
    """
    Update order status and prevent overwriting if already assigned.

    Args:
        order_id: Order ID to update
        status: The new status
        delivery_instructions: Optional delivery instructions to update

    Returns:
        Updated order or None if not found
    """
    db = SessionLocal()
    try:
        order = db.query(OrderModel).filter(OrderModel.id == order_id).first()
        if not order:
            return None

        # Update delivery instructions if provided
        if delivery_instructions is not None:
            order.deliveryInstructions = delivery_instructions

        # ✅ Only update if status is different
        if order.status != status:
            order.status = OrderStatus(status)
            
        db.commit()
        db.refresh(order)

        return order
    finally:
        db.close()


def cancel_order(order_id: int, cancel_message: str, cancelled_by_user_id: int) -> Optional[OrderModel]:
    """
    Cancel an order and record cancellation details
    
    Args:
        order_id: The ID of the order to cancel
        cancel_message: The reason for cancellation
        cancelled_by_user_id: The ID of the user who cancelled the order (customer, manager, delivery)
        
    Returns:
        The canceled order, or None if the order doesn't exist
    """
    db = SessionLocal()
    try:
        order = db.query(OrderModel).filter(OrderModel.id == order_id).first()
        if not order:
            return None
            
        # Check if order is already cancelled
        if order.status == OrderStatus.CANCELLED:
            return order
            
        # Store cancellation details
        order.status = OrderStatus.CANCELLED
        order.cancelMessage = cancel_message
        order.cancelledByUserId = cancelled_by_user_id
        order.cancelledAt = datetime.now()
        
        db.commit()
        db.refresh(order)
        return order
    finally:
        db.close()

def update_order_bill_url(order_id: int, bill_url: Optional[str] = None) -> Optional[OrderModel]:
    """
    Update the bill URL for an order
    
    Args:
        order_id: The ID of the order to update
        bill_url: The new bill URL (can be None to remove the bill)
        
    Returns:
        The updated order, or None if the order doesn't exist
    """
    db = SessionLocal()
    try:
        order = db.query(OrderModel).filter(OrderModel.id == order_id).first()
        if not order:
            return None
            
        order.bill_url = bill_url
        db.commit()
        db.refresh(order)
        return order
    finally:
        db.close()

def update_order_items(
    order_id: int, 
    order_item_updates: List[dict], 
    total_amount: float, 
    tax_amount: Optional[float] = None,
    order_total_amount: float = None
) -> Optional[OrderModel]:
    """
    Update order items and recalculate totals for an order
    
    Args:
        order_id: The ID of the order to update
        order_item_updates: List of order item updates [{"order_item_id": int, "quantity_change": int}, ...]
                           A negative quantity_change means reduce quantity, positive means increase
                           A quantity_change of None means delete the item
        total_amount: The updated total amount for products
        tax_amount: The updated tax amount for the order
        order_total_amount: The updated final total amount for the order
    
    Returns:
        The updated order, or None if the order doesn't exist
    """
    db = SessionLocal()
    try:
        # Get the order
        order = db.query(OrderModel).filter(OrderModel.id == order_id).first()
        if not order:
            return None
        
        # Allow updating orders in PENDING, ORDER_PLACED, or ACCEPTED state
        editable_statuses = [OrderStatus.PENDING, OrderStatus.ORDER_PLACED, OrderStatus.ACCEPTED]
        if order.status not in editable_statuses:
            raise ValueError(f"Cannot update items for order with status {order.status}. Only orders with status PENDING, ORDER_PLACED, or ACCEPTED can be updated.")
        
        # Update order amounts
        order.totalAmount = total_amount
        
        if tax_amount is not None:
            order.taxAmount = tax_amount
            
        if order_total_amount is not None:
            order.orderTotalAmount = order_total_amount
        
        # Process each order item update
        for update in order_item_updates:
            order_item_id = update.get("order_item_id")
            quantity_change = update.get("quantity_change")
            
            # Get the order item
            order_item = db.query(OrderItemModel).filter(
                OrderItemModel.id == order_item_id,
                OrderItemModel.orderId == order_id
            ).first()
            
            if not order_item:
                continue  # Skip if order item not found
            
            # Check if this is the original item or an already updated one
            if order_item.updatedOrderitemsId is not None:
                # This is already updated once, we need to find the latest revision
                latest_item = order_item
                while latest_item.updated_order_item is not None:
                    latest_item = latest_item.updated_order_item
                
                # Update or delete the latest revision
                if quantity_change is None:
                    # Delete the item (mark as zero quantity)
                    new_order_item = OrderItemModel(
                        productId=latest_item.productId,
                        quantity=0,  # Set to zero to indicate deletion
                        orderId=order_id,
                        orderAmount=0,
                        inventoryId=latest_item.inventoryId
                    )
                    db.add(new_order_item)
                    db.flush()  # Get the ID
                    
                    # Link to the original item
                    latest_item.updatedOrderitemsId = new_order_item.id
                else:
                    # Calculate new quantity (can't be negative)
                    new_quantity = max(0, latest_item.quantity + quantity_change)
                    
                    # Create a new order item with updated quantity
                    new_order_item = OrderItemModel(
                        productId=latest_item.productId,
                        quantity=new_quantity,
                        orderId=order_id,
                        orderAmount=latest_item.orderAmount / latest_item.quantity * new_quantity if latest_item.quantity > 0 else 0,
                        inventoryId=latest_item.inventoryId
                    )
                    db.add(new_order_item)
                    db.flush()  # Get the ID
                    
                    # Link to the original item
                    latest_item.updatedOrderitemsId = new_order_item.id
            else:
                # This is the original item, create a new revision
                if quantity_change is None:
                    # Delete the item (mark as zero quantity)
                    new_order_item = OrderItemModel(
                        productId=order_item.productId,
                        quantity=0,  # Set to zero to indicate deletion
                        orderId=order_id,
                        orderAmount=0,
                        inventoryId=order_item.inventoryId
                    )
                    db.add(new_order_item)
                    db.flush()  # Get the ID
                    
                    # Link to the original item
                    order_item.updatedOrderitemsId = new_order_item.id
                else:
                    # Calculate new quantity (can't be negative)
                    new_quantity = max(0, order_item.quantity + quantity_change)
                    
                    # Create a new order item with updated quantity
                    new_order_item = OrderItemModel(
                        productId=order_item.productId,
                        quantity=new_quantity,
                        orderId=order_id,
                        orderAmount=order_item.orderAmount / order_item.quantity * new_quantity if order_item.quantity > 0 else 0,
                        inventoryId=order_item.inventoryId
                    )
                    db.add(new_order_item)
                    db.flush()  # Get the ID
                    
                    # Link to the original item
                    order_item.updatedOrderitemsId = new_order_item.id
        
        db.commit()
        db.refresh(order)
        return order
    finally:
        db.close() 