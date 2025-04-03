from sqlalchemy import Column, Integer, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
from app.db.base import Base

class DeliveryModel(Base):
    __tablename__ = 'delivery'
    
    id = Column(Integer, primary_key=True, index=True)
    orderId = Column(Integer, ForeignKey("orders.id"), nullable=False)
    driverId = Column(Integer, ForeignKey("users.id"), nullable=True)
    pickedUpTime = Column(DateTime, nullable=True)
    deliveredTime = Column(DateTime, nullable=True)
    photo = Column(String, nullable=True)
    comments = Column(String, nullable=True)
    
    # Relationships
    order = relationship("OrderModel", back_populates="delivery")
    driver = relationship("UserModel", back_populates="deliveries")
