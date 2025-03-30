from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class AddressModel(Base):
    __tablename__ = 'address'
    
    id = Column(Integer, primary_key=True, index=True)
    address = Column(String, nullable=False)
    userId = Column(Integer, ForeignKey("users.id"), nullable=False)
    isPrimary = Column(Boolean, default=False)
    
    # Relationships
    user = relationship("UserModel", back_populates="address")
    orders = relationship("OrderModel", back_populates="address", foreign_keys="OrderModel.addressId")
