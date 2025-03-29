from sqlalchemy import Column, Integer, DateTime, ForeignKey, Enum, String
from sqlalchemy.orm import relationship
from app.db.base import Base
import strawberry
import enum

@strawberry.enum
class DeliveryStatus(enum.Enum):
    SCHEDULED = "SCHEDULED"
    PICKED_UP = "PICKED_UP"
    DELIVERED = "DELIVERED"
    FAILED = "FAILED"

class DeliveryModel(Base):
    __tablename__ = 'delivery'
    
    id = Column(Integer, primary_key=True, index=True)
    orderId = Column(Integer, ForeignKey("orders.id"), nullable=False)
    driverId = Column(Integer, ForeignKey("users.id"), nullable=True)
    schedule = Column(DateTime, nullable=False)
    pickedUpTime = Column(DateTime, nullable=True)
    deliveredTime = Column(DateTime, nullable=True)
    status = Column(Enum(DeliveryStatus), nullable=False)
    photo = Column(String, nullable=True)
    comments = Column(String, nullable=True)
    
    # Relationships
    order = relationship("OrderModel", back_populates="delivery")
    driver = relationship("UserModel", back_populates="deliveries")
