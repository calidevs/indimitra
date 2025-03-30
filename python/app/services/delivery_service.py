from typing import List, Optional
from datetime import datetime
from sqlalchemy.exc import IntegrityError

from app.db.session import SessionLocal
from app.db.models.delivery import DeliveryModel
from app.db.models.order import OrderModel
from app.db.models.user import UserModel
from app.db.models.delivery import DeliveryStatus

def get_delivery_by_driver(driver_id: int) -> List[DeliveryModel]:
    """
    Fetch all deliveries assigned to a specific driver along with the order status.
    """
    db = SessionLocal()
    try:
        from sqlalchemy.orm import joinedload

        deliveries = (
            db.query(DeliveryModel)
            .filter(DeliveryModel.driverId == driver_id)
            .options(joinedload(DeliveryModel.order))  # ✅ Load related Order
            .all()
        )

        return deliveries  # ✅ Don't modify objects dynamically, let GraphQL handle it
    finally:
        db.close()


def assign_delivery(order_id: int, driver_id: int, schedule_time: datetime) -> Optional[DeliveryModel]:
    """
    Assign a delivery partner to an order or update if already assigned.
    Ensures no duplicate order IDs exist in the delivery table.
    Handles foreign key violations properly.
    """
    db = SessionLocal()
    try:
        # ✅ Check if order exists
        order = db.query(OrderModel).filter(OrderModel.id == order_id).first()
        if not order:
            raise ValueError(f"Order with ID {order_id} not found.")

        # ✅ Check if driver exists in users table
        driver = db.query(UserModel).filter(UserModel.id == driver_id, UserModel.type == "DELIVERY").first()
        if not driver:
            raise ValueError(f"Driver with ID {driver_id} does not exist in users table.")

        # ✅ Check if a delivery already exists for this order
        delivery = db.query(DeliveryModel).filter(DeliveryModel.orderId == order_id).first()

        if delivery:
            # ✅ Update the existing delivery record
            delivery.driverId = driver_id
            delivery.schedule = schedule_time
            delivery.status = DeliveryStatus.SCHEDULED
        else:
            # ✅ Create a new delivery record if it doesn't exist
            delivery = DeliveryModel(
                orderId=order_id,
                driverId=driver_id,
                schedule=schedule_time,
                pickedUpTime=None,
                deliveredTime=None,
                status=DeliveryStatus.SCHEDULED
            )
            db.add(delivery)

        db.commit()
        db.refresh(delivery)
        return delivery

    except IntegrityError:
        db.rollback()  # ✅ Rollback to prevent corruption
        raise ValueError("Foreign Key Violation: The driver ID does not exist in users table.")

    finally:
        db.close()


def update_delivery_status(order_id: int, picked_up_time: Optional[datetime] = None, delivered_time: Optional[datetime] = None) -> Optional[DeliveryModel]:
    """
    Update delivery status, including pickup and delivery times
    """
    db = SessionLocal()
    try:
        delivery = db.query(DeliveryModel).filter(DeliveryModel.orderId == order_id).first()
        if not delivery:
            return None
        
        if picked_up_time:
            delivery.pickedUpTime = picked_up_time
        if delivered_time:
            delivery.deliveredTime = delivered_time
        
        db.commit()
        db.refresh(delivery)
        return delivery
    finally:
        db.close()
