from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class StoreModel(Base):
    __tablename__ = 'store'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    radius = Column(Float, nullable=True)
    managerUserId = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    manager = relationship("UserModel", back_populates="stores")
    inventory = relationship("InventoryModel", back_populates="store")
    drivers = relationship("StoreDriverModel", back_populates="store")
