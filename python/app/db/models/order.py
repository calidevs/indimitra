from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from app.db.base import Base
import strawberry
import enum
from .fees import FeeType

@strawberry.enum
class OrderStatus(enum.Enum):
    PENDING = "PENDING"
    ORDER_PLACED = "ORDER_PLACED"
    ACCEPTED = "ACCEPTED"
    CANCELLED = "CANCELLED"
    READY_FOR_DELIVERY = "READY_FOR_DELIVERY"
    SCHEDULED = "SCHEDULED"
    PICKED_UP = "PICKED_UP"
    DELIVERED = "DELIVERED"

class OrderModel(Base):
    __tablename__ = 'orders'
    
    id = Column(Integer, primary_key=True, index=True)
    createdByUserId = Column(Integer, ForeignKey("users.id"), nullable=False)
    addressId = Column(Integer, ForeignKey("address.id"), nullable=True)
    pickupId = Column(Integer, ForeignKey("pickup_addresses.id"), nullable=True)
    type = Column(Enum(FeeType), nullable=True)
    storeId = Column(Integer, ForeignKey("store.id"), nullable=False)
    status = Column(Enum(OrderStatus), nullable=False)
    paymentId = Column(Integer, ForeignKey("payment.id"), nullable=True)
    totalAmount = Column(Float, nullable=False)
    deliveryDate = Column(DateTime, nullable=True)
    deliveryInstructions = Column(String, nullable=True)
    bill_url = Column(String, nullable=True)  # URL to the order bill in S3
    deliveryFee = Column(Float, nullable=True)
    tipAmount = Column(Float, nullable=True)
    orderTotalAmount = Column(Float, nullable=False)
    taxAmount = Column(Float, nullable=True)
    display_code = Column(String, nullable=True)
    custom_order = Column(String, nullable=True)
    # Cancellation tracking fields
    cancelMessage = Column(String, nullable=True)
    cancelledByUserId = Column(Integer, ForeignKey("users.id"), nullable=True)
    cancelledAt = Column(DateTime, nullable=True)
    
    # Relationships
    creator = relationship("UserModel", foreign_keys=[createdByUserId], back_populates="orders")
    payment = relationship("PaymentModel", back_populates="orders")
    order_items = relationship("OrderItemModel", back_populates="order")
    delivery = relationship("DeliveryModel", uselist=False, back_populates="order")
    address = relationship("AddressModel", foreign_keys=[addressId])
    pickup_address = relationship("PickupAddressModel", foreign_keys=[pickupId])
    cancelled_by = relationship("UserModel", foreign_keys=[cancelledByUserId], back_populates="cancelled_orders")
    store = relationship("StoreModel", foreign_keys=[storeId])
