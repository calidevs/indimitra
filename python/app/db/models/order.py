from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.db.base import Base
import strawberry
import enum

@strawberry.enum
class OrderStatus(enum.Enum):
    PENDING = "PENDING"
    CANCELLED = "CANCELLED"
    COMPLETE = "COMPLETE"

class OrderModel(Base):
    __tablename__ = 'orders'
    
    id = Column(Integer, primary_key=True, index=True)
    createdByUserId = Column(String, ForeignKey("users.id"), nullable=False)
    address = Column(String, nullable=False)
    status = Column(Enum(OrderStatus), nullable=False)
    paymentId = Column(Integer, ForeignKey("payment.id"), nullable=True)
    totalAmount = Column(Float, nullable=False)
    deliveryDate = Column(DateTime, nullable=True)
    
    # Relationships
    creator = relationship("UserModel", back_populates="orders")
    payment = relationship("PaymentModel", back_populates="orders")
    order_items = relationship("OrderItemModel", back_populates="order")
    delivery = relationship("DeliveryModel", uselist=False, back_populates="order")
