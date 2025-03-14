import strawberry
from typing import List, Optional
from datetime import datetime

from app.services.delivery_service import (
    get_delivery_by_driver,
    assign_delivery,
    update_delivery_status
)

# ✅ Define a Strawberry Type for Delivery
@strawberry.type
class Delivery:
    id: int
    orderId: int
    driverId: int
    schedule: datetime
    pickedUpTime: Optional[datetime] = None
    deliveredTime: Optional[datetime] = None
    photo: Optional[str] = None
    comments: Optional[str] = None


# ✅ Define a Query Resolver
@strawberry.type
class DeliveryQuery:
    @strawberry.field
    def getDeliveriesByDriver(self, driverId: str) -> List[Delivery]:
        """
        Fetch all deliveries assigned to a specific driver
        
        Args:
            driverId: The ID of the driver
        
        Returns:
            List of Delivery objects
        """
        return get_delivery_by_driver(driverId)


# ✅ Define Input Type for Assigning a Delivery
@strawberry.input
class AssignDeliveryInput:
    orderId: int
    driverId: int
    scheduleTime: datetime


# ✅ Define the Mutation Resolver
@strawberry.type
class DeliveryMutation:
    @strawberry.mutation
    def assignDelivery(self, input: AssignDeliveryInput) -> Optional[Delivery]:
        """
        Assign a delivery partner to an order
        
        Args:
            input: Contains orderId, driverId, and scheduleTime
        
        Returns:
            Assigned Delivery object or None
        """
        return assign_delivery(
            order_id=input.orderId, driver_id=input.driverId, schedule_time=input.scheduleTime
        )

    @strawberry.mutation
    def updateDeliveryStatus(
        self,
        orderId: int,
        pickedUpTime: Optional[datetime] = None,
        deliveredTime: Optional[datetime] = None,
        photo: Optional[str] = None,
        comments: Optional[str] = None
    ) -> Optional[Delivery]:
        """
        Update delivery status (e.g., picked up, delivered)
        
        Args:
            orderId: ID of the order
            pickedUpTime: Optional timestamp when order was picked up
            deliveredTime: Optional timestamp when order was delivered
            photo: Optional photo URL of delivered package
            comments: Optional comments from the driver
        
        Returns:
            Updated Delivery object or None
        """
        return update_delivery_status(
            order_id=orderId,
            picked_up_time=pickedUpTime,
            delivered_time=deliveredTime,
            photo=photo,
            comments=comments
        )


# ✅ Final Schema Setup
DeliverySchema = strawberry.Schema(query=DeliveryQuery, mutation=DeliveryMutation)
