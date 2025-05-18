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
    update_order_status,
    get_orders_by_store,
    update_order_bill_url,
    update_order_items
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
    
    @strawberry.field
    def getOrdersByStore(self, storeId: int) -> List[Order]:
        """Fetch all orders for a specific store"""
        return get_orders_by_store(store_id=storeId)


# ✅ Input Type for Order Items
@strawberry.input
class OrderItemInput:
    """Defines input format for creating order items"""
    productId: int
    quantity: int


# ✅ Input Type for Updating Order Items
@strawberry.input
class OrderItemUpdateInput:
    """Defines input format for updating order items"""
    orderItemId: int
    quantityChange: Optional[int] = None  # None means delete, positive/negative means increase/decrease


# ✅ Input Type for Updating Order Status
@strawberry.input
class UpdateOrderStatusInput:
    """Defines input format for updating order status"""
    orderId: int
    status: str
    driverId: Optional[int] = None  # Required if status = READY_FOR_DELIVERY
    scheduleTime: Optional[datetime] = None  # Required if status = READY_FOR_DELIVERY
    deliveryInstructions: Optional[str] = None  # Optional delivery instructions


# ✅ Order Mutations
@strawberry.type
class OrderMutation:
    @strawberry.mutation
    def createOrder(
        self,
        userId: int,
        addressId: int,
        storeId: int,
        productItems: List[OrderItemInput],
        totalAmount: float,
        orderTotalAmount: float,
        deliveryFee: Optional[float] = None,
        tipAmount: Optional[float] = None,
        taxAmount: Optional[float] = None,
        deliveryInstructions: Optional[str] = None
    ) -> Order:
        """
        Create a new order with multiple order items.
        
        Args:
            userId (int): The ID of the user placing the order.
            addressId (int): The ID of the delivery address.
            storeId (int): The ID of the store the order is being placed from.
            productItems (List[OrderItemInput]): List of items with product IDs and quantities.
            totalAmount (float): The subtotal amount of products.
            orderTotalAmount (float): The final total amount including all fees and taxes.
            deliveryFee (float, optional): Delivery fee.
            tipAmount (float, optional): Tip amount.
            taxAmount (float, optional): Tax amount.
            deliveryInstructions (str, optional): Special instructions for delivery.
        
        Returns:
            Order: The newly created order.
            
        Raises:
            Exception: If address validation fails, including if delivery to that pincode is not supported.
        """
        try:
            # Convert OrderItemInput to dictionary
            items = [{"product_id": item.productId, "quantity": item.quantity} for item in productItems]
            return create_order(
                user_id=userId, 
                address_id=addressId, 
                store_id=storeId,
                product_items=items,
                total_amount=totalAmount,
                order_total_amount=orderTotalAmount,
                delivery_fee=deliveryFee,
                tip_amount=tipAmount,
                tax_amount=taxAmount,
                delivery_instructions=deliveryInstructions
            )
        except ValueError as e:
            raise Exception(str(e))
    
    @strawberry.mutation
    def cancelOrderById(self, orderId: int, cancelMessage: str, cancelledByUserId: int) -> Optional[Order]:
        """
        Cancel an order and record cancellation details.
        
        Args:
            orderId (int): Order ID to cancel.
            cancelMessage (str): Reason for cancellation.
            cancelledByUserId (int): ID of the user who cancelled the order (customer, manager, delivery).
        
        Returns:
            Optional[Order]: The canceled order or None if not found.
        """
        return cancel_order(
            order_id=orderId,
            cancel_message=cancelMessage,
            cancelled_by_user_id=cancelledByUserId
        )
    
    @strawberry.mutation
    def updateOrderStatus(self, input: UpdateOrderStatusInput) -> Optional[Order]:
        """
        Update order status and remove the assigned delivery record if needed.

        Args:
            input: Contains orderId, status, driverId (optional), scheduleTime (optional),
                  and deliveryInstructions (optional).
            scheduleTime is used to set the deliveryDate for the order.
            deliveryInstructions can be used to add special instructions for delivery.

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

            # ✅ Update delivery instructions if provided
            if input.deliveryInstructions is not None:
                order.deliveryInstructions = input.deliveryInstructions
                db.commit()

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

                # ✅ Set order's deliveryDate first
                order.deliveryDate = input.scheduleTime
                db.commit()
                
                # ✅ Then assign delivery
                assign_delivery(order_id=input.orderId, driver_id=input.driverId, schedule_time=input.scheduleTime)

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
    
    @strawberry.mutation
    def updateOrderBillUrl(self, orderId: int, billUrl: Optional[str] = None) -> Optional[Order]:
        """
        Update the bill URL for an order
        
        Args:
            orderId: The ID of the order to update
            billUrl: The new bill URL (can be None to remove the bill)
            
        Returns:
            The updated order, or None if the order doesn't exist
        """
        try:
            order = update_order_bill_url(order_id=orderId, bill_url=billUrl)
            if not order:
                raise Exception(f"Order with ID {orderId} not found")
            return order
        except ValueError as e:
            raise Exception(str(e))
            
    @strawberry.mutation
    def updateOrderItems(
        self,
        orderId: int,
        orderItemUpdates: List[OrderItemUpdateInput],
        totalAmount: float,
        orderTotalAmount: float,
        taxAmount: Optional[float] = None
    ) -> Optional[Order]:
        """
        Update order items with the store manager's changes
        
        Args:
            orderId: The ID of the order to update
            orderItemUpdates: List of order item updates including ID and quantity change
                              A None quantityChange means delete the item
            totalAmount: The updated total amount for products
            orderTotalAmount: The updated final total amount for the order
            taxAmount: The updated tax amount for the order
        
        Returns:
            The updated order, or None if the order doesn't exist
        """
        try:
            # Convert input to dictionary format expected by service
            updates = [
                {
                    "order_item_id": item.orderItemId,
                    "quantity_change": item.quantityChange
                }
                for item in orderItemUpdates
            ]
            
            order = update_order_items(
                order_id=orderId,
                order_item_updates=updates,
                total_amount=totalAmount,
                tax_amount=taxAmount,
                order_total_amount=orderTotalAmount
            )
            
            if not order:
                raise Exception(f"Order with ID {orderId} not found")
                
            return order
        except ValueError as e:
            raise Exception(str(e))

