import enum
from sqlalchemy import Column, Integer, String, Boolean, Enum
from sqlalchemy.orm import relationship
from app.db.base import Base

class UserType(enum.Enum):
    ADMIN = "ADMIN"
    USER = "USER"
    DELIVERY = "DELIVERY"
    STORE_MANAGER = "STORE_MANAGER"

class UserModel(Base):
    __tablename__ = 'users'
    
    id = Column(String, primary_key=True, index=True)
    firstName = Column(String, nullable=False)
    lastName = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    mobile = Column(String)
    active = Column(Boolean, default=True)
    type = Column(Enum(UserType), nullable=False)
    referredBy = Column(String, nullable=True)
    referralId = Column(String, nullable=False)
    
    # Relationships
    categories = relationship("CategoryModel", back_populates="creator")
    orders = relationship("OrderModel", back_populates="creator")
    addresses = relationship("AddressModel", back_populates="user")
    deliveries = relationship("DeliveryModel", back_populates="driver")
    stores = relationship("StoreModel", back_populates="manager")
