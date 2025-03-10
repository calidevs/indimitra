import strawberry
from typing import List, Optional
from strawberry.types import Info

from app.graphql.types import Order, OrderItem
from app.services.order_service import (
    get_all_orders, 
    get_orders_by_user, 
    get_order_by_id, 
    create_order, 
    cancel_order, 
    update_order_status
)

@strawberry.type
class OrderQuery:
    @strawberry.field
    def getAllOrders(self) -> List[Order]:
        """Get all orders in the system"""
        return get_all_orders()
    
    @strawberry.field
    def getOrderById(self, orderId: int) -> Optional[Order]:
        """
        Get a specific order by ID
        
        Args:
            orderId: The unique identifier of the order
        """
        return get_order_by_id(order_id=orderId)
    
    @strawberry.field
    def getOrdersByUser(self, userId: str) -> List[Order]:
        """
        Get all orders for a specific user
        
        Args:
            userId: The unique identifier of the user
        """
        return get_orders_by_user(user_id=userId)

@strawberry.input
class OrderItemInput:
    """Input type for creating order items"""
    productId: int
    quantity: int

@strawberry.type
class OrderMutation:
    @strawberry.mutation
    def createOrder(
        self,
        userId: str,
        address: str,
        productItems: List[OrderItemInput]
    ) -> Order:
        """
        Create a new order with multiple order items
        
        Args:
            userId: The ID of the user creating the order
            address: The delivery address
            productItems: List of product items with product IDs and quantities
        
        Returns:
            The created order with all its items
        """
        # Convert OrderItemInput to dict for service function
        items = [{"product_id": item.productId, "quantity": item.quantity} for item in productItems]
        return create_order(user_id=userId, address=address, product_items=items)
    
    @strawberry.mutation
    def cancelOrderById(self, orderId: int) -> Optional[Order]:
        """
        Cancel an order by its ID
        
        Args:
            orderId: The ID of the order to cancel
        
        Returns:
            The canceled order, or None if the order doesn't exist
        """
        return cancel_order(order_id=orderId)
    
    @strawberry.mutation
    def updateOrderStatus(self, orderId: int, status: str) -> Optional[Order]:
        """
        Update the status of an order
        
        Args:
            orderId: The ID of the order to update
            status: The new status (PENDING, CANCELLED, COMPLETE)
            
        Returns:
            The updated order, or None if the order doesn't exist
        """
        return update_order_status(order_id=orderId, status=status) 