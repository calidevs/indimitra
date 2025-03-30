from typing import List, Optional
from datetime import datetime

from app.db.session import SessionLocal
from app.db.models.order import OrderModel, OrderStatus
from app.db.models.order_item import OrderItemModel
from app.db.models.product import ProductModel

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

def create_order(user_id: int, address: str, product_items: List[dict]) -> OrderModel:
    """
    Create a new order with multiple order items
    
    Args:
        user_id: The ID of the user creating the order
        address: The delivery address
        product_items: List of product items [{"product_id": int, "quantity": int}, ...]
    
    Returns:
        The created order
    """
    db = SessionLocal()
    try:
        # Extract all product IDs from the items
        product_ids = [item["product_id"] for item in product_items]
        
        # Fetch all products in a single query
        products = db.query(ProductModel).filter(ProductModel.id.in_(product_ids)).all()
        
        # Create a dictionary for quick lookup by product_id
        products_dict = {product.id: product for product in products}
        
        # Verify all products exist
        for item in product_items:
            if item["product_id"] not in products_dict:
                raise ValueError(f"Product with ID {item['product_id']} not found")
        
        # Calculate total amount
        total_amount = 0.0
        for item in product_items:
            product = products_dict[item["product_id"]]
            total_amount += product.price * item["quantity"]
        
        # Create the order
        order = OrderModel(
            createdByUserId=user_id,
            address=address,
            status=OrderStatus.PENDING,
            totalAmount=total_amount,
            deliveryDate=None  # Will be set when delivery is scheduled
        )
        
        db.add(order)
        db.flush()  # Flush to get the order ID before creating order items
        
        # Create order items
        for item in product_items:
            product = products_dict[item["product_id"]]
            order_item = OrderItemModel(
                productId=item["product_id"],
                quantity=item["quantity"],
                orderId=order.id,
                orderAmount=product.price * item["quantity"]
            )
            db.add(order_item)
        
        # Update product stock, just putting it out here
        for item in product_items:
            product = products_dict[item["product_id"]]
            product.stock -= item["quantity"]
        
        db.commit()
        db.refresh(order)
        
        return order
    finally:
        db.close()

def update_order_status(order_id: int, status: str) -> Optional[OrderModel]:
    """
    Update order status and prevent overwriting if already assigned.

    Args:
        order_id: Order ID to update
        status: The new status

    Returns:
        Updated order or None if not found
    """
    db = SessionLocal()
    try:
        order = db.query(OrderModel).filter(OrderModel.id == order_id).first()
        if not order:
            return None

        # ✅ Only update if status is different
        if order.status != status:
            order.status = OrderStatus(status)
            db.commit()
            db.refresh(order)

        return order
    finally:
        db.close()


def cancel_order(order_id: int) -> Optional[OrderModel]:
    """
    Cancel an order
    
    Args:
        order_id: The ID of the order to cancel
        
    Returns:
        The canceled order, or None if the order doesn't exist
    """
    return update_order_status(order_id, "CANCELLED") 