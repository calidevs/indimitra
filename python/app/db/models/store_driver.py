from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base import Base

class StoreDriverModel(Base):
    __tablename__ = 'store_driver'
    
    id = Column(Integer, primary_key=True, index=True)
    userId = Column(Integer, ForeignKey("users.id"), nullable=False)
    storeId = Column(Integer, ForeignKey("store.id"), nullable=False)
    
    # Relationships
    driver = relationship("UserModel", back_populates="driver_stores")
    store = relationship("StoreModel", back_populates="drivers")
    
    # Make sure a driver isn't assigned to the same store twice
    __table_args__ = (
        UniqueConstraint('userId', 'storeId', name='unique_store_driver'),
    ) 