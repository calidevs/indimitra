from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class InventoryModel(Base):
    __tablename__ = 'inventory'
    
    id = Column(Integer, primary_key=True, index=True)
    storeId = Column(Integer, ForeignKey("store.id"), nullable=False)
    productId = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    store = relationship("StoreModel", back_populates="inventory")
    product = relationship("ProductModel", back_populates="inventory_items")
