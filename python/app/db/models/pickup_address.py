from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class PickupAddressModel(Base):
    __tablename__ = 'pickup_addresses'
    
    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("store.id"), nullable=False)
    address = Column(String, nullable=False)
    
    # Relationships
    store = relationship("StoreModel", back_populates="pickup_addresses")
    orders = relationship("OrderModel", back_populates="pickup_address", foreign_keys="OrderModel.pickupId") 