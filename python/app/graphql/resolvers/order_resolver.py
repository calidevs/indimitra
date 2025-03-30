import strawberry
from typing import List, Optional
from datetime import datetime
from app.db.session import SessionLocal

from app.graphql.types import Order
from app.db.models.order import OrderModel, OrderStatus
from app.db.models.delivery import DeliveryModel
from app.db.models.user import UserModel
from app.services.order_service import (
    get_all_orders, 
    get_orders_by_user, 
    get_order_by_id, 
    create_order, 
    cancel_order, 
    update_order_status
)
from app.services.delivery_service import assign_delivery


# ✅ Order Queries
@strawberry.type
class OrderQuery:
    @strawberry.field
    def getAllOrders(self) -> List[Order]:
        """Fetch all orders"""
        return get_all_orders()
    
    @strawberry.field
    def getOrderById(self, orderId: int) -> Optional[Order]:
        """Fetch a specific order by ID"""
        return get_order_by_id(order_id=orderId)
    
    @strawberry.field
    def getOrdersByUser(self, userId: int) -> List[Order]:
        """Fetch all orders placed by a specific user"""
        return get_orders_by_user(user_id=userId)


# ✅ Input Type for Order Items
@strawberry.input
class OrderItemInput:
    """Defines input format for creating order items"""
    productId: int
    quantity: int


# ✅ Input Type for Updating Order Status
@strawberry.input
class UpdateOrderStatusInput:
    """Defines input format for updating order status"""
    orderId: int
    status: str
    driverId: Optional[int] = None  # Required if status = READY_FOR_DELIVERY
    scheduleTime: Optional[datetime] = None  # Required if status = READY_FOR_DELIVERY


# ✅ Order Mutations
@strawberry.type
class OrderMutation:
    @strawberry.mutation
    def createOrder(
        self,
        userId: int,
        addressId: int,
        productItems: List[OrderItemInput]
    ) -> Order:
        """
        Create a new order with multiple order items.
        
        Args:
            userId (int): The ID of the user placing the order.
            addressId (int): The ID of the delivery address.
            productItems (List[OrderItemInput]): List of items with product IDs and quantities.
        
        Returns:
            Order: The newly created order.
        """
        # Convert OrderItemInput to dictionary
        items = [{"product_id": item.productId, "quantity": item.quantity} for item in productItems]
        return create_order(user_id=userId, address_id=addressId, product_items=items)
    
    @strawberry.mutation
    def cancelOrderById(self, orderId: int) -> Optional[Order]:
        """
        Cancel an order.
        
        Args:
            orderId (int): Order ID to cancel.
        
        Returns:
            Optional[Order]: The canceled order or None if not found.
        """
        return cancel_order(order_id=orderId)
    
    @strawberry.mutation
    def updateOrderStatus(self, input: UpdateOrderStatusInput) -> Optional[Order]:
        """
        Update order status and remove the assigned delivery record if needed.

        Args:
            input: Contains orderId, status, driverId (optional), and scheduleTime (optional).

        Returns:
            Updated Order object.
        """

        db = SessionLocal()
        try:
            # ✅ Check if order exists
            order = db.query(OrderModel).filter(OrderModel.id == input.orderId).first()
            if not order:
                raise ValueError(f"Order with ID {input.orderId} not found.")

            # ✅ Check if status is valid
            if input.status not in OrderStatus.__members__:
                raise ValueError(f"Invalid order status: {input.status}. Allowed: {list(OrderStatus.__members__.keys())}")

            # Define statuses that should maintain the delivery agent
            delivery_progression_statuses = ["READY_FOR_DELIVERY", "SCHEDULED", "PICKED_UP", "DELIVERED"]

            # ✅ If order status changes to a status outside the delivery progression, remove the driver
            delivery = db.query(DeliveryModel).filter(DeliveryModel.orderId == input.orderId).first()
            if delivery and input.status not in delivery_progression_statuses:
                # Instead of deleting, set the driver to null and update status to FAILED
                delivery.driverId = None
                db.commit() 

            # ✅ Assign Delivery only if status is READY_FOR_DELIVERY
            if input.status == "READY_FOR_DELIVERY":
                if not input.driverId:
                    raise ValueError("Driver ID is required for READY_FOR_DELIVERY.")
                if not input.scheduleTime:
                    raise ValueError("Schedule time is required for READY_FOR_DELIVERY.")

                # ✅ Check if driver exists
                driver = db.query(UserModel).filter(UserModel.id == input.driverId, UserModel.type == "DELIVERY").first()
                if not driver:
                    raise ValueError(f"Driver with ID {input.driverId} not found or not a delivery driver.")

                # ✅ Assign delivery
                assign_delivery(order_id=input.orderId, driver_id=input.driverId, schedule_time=input.scheduleTime)

                # Use scheduleTime for the order's deliveryDate
                order.deliveryDate = input.scheduleTime
                db.commit()

            # ✅ Update order status only if changed
            if order.status != input.status:
                order.status = OrderStatus[input.status]
                db.commit()
                db.refresh(order)

            return order

        except ValueError as e:
            return str(e)  # ✅ Return detailed error message

        except Exception as e:
            return f"Unexpected error: {str(e)}"  # ✅ Catch unexpected errors

        finally:
            db.close()

