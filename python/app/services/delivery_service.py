from typing import List, Optional
from datetime import datetime

from app.db.session import SessionLocal
from app.db.models.delivery import DeliveryModel
from app.db.models.order import OrderModel
from app.db.models.user import UserModel

from sqlalchemy.orm import joinedload

def get_delivery_by_driver(driver_id: int) -> List[DeliveryModel]:
    """
    Fetch all deliveries assigned to a specific driver
    """
    db = SessionLocal()
    try:
        return (
            db.query(DeliveryModel)
            .filter(DeliveryModel.driverId == driver_id)
            .options(
                joinedload(DeliveryModel.order)
            )
            .all()
        )
    finally:
        db.close()

def assign_delivery(order_id: int, driver_id: int, schedule_time: datetime) -> Optional[DeliveryModel]:
    """
    Assign a delivery partner to an order
    """
    db = SessionLocal()
    try:
        order = db.query(OrderModel).filter(OrderModel.id == order_id).first()
        if not order:
            return None
        
        driver = db.query(UserModel).filter(UserModel.id == driver_id, UserModel.type == "DELIVERY").first()
        if not driver:
            return None
        
        delivery = DeliveryModel(
            orderId=order_id,
            driverId=driver_id,
            schedule=schedule_time,
            pickedUpTime=None,
            deliveredTime=None,
            photo=None,
            comments=None,
        )
        db.add(delivery)
        db.commit()
        db.refresh(delivery)
        return delivery
    finally:
        db.close()


def update_delivery_status(order_id: int, picked_up_time: Optional[datetime] = None, delivered_time: Optional[datetime] = None, photo: Optional[str] = None, comments: Optional[str] = None) -> Optional[DeliveryModel]:
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
        if photo:
            delivery.photo = photo
        if comments:
            delivery.comments = comments
        
        db.commit()
        db.refresh(delivery)
        return delivery
    finally:
        db.close()
