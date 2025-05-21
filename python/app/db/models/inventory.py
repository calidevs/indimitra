from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, ForeignKey, Float, String, Boolean
from sqlalchemy.orm import relationship
from app.db.base import Base

class InventoryModel(Base):
    __tablename__ = 'inventory'
    
    id = Column(Integer, primary_key=True, index=True)
    storeId = Column(Integer, ForeignKey("store.id"), nullable=False)
    productId = Column(Integer, ForeignKey("products.id"), nullable=False)
    price = Column(Float, nullable=True)
    quantity = Column(Integer, nullable=True)
    measurement = Column(Integer, nullable=True)
    unit = Column(String, nullable=True)
    is_listed = Column(Boolean, default=True, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, nullable=True)
    
    # Relationships
    store = relationship("StoreModel", back_populates="inventory")
    product = relationship("ProductModel", back_populates="inventory_items")
    order_items = relationship("OrderItemModel", back_populates="inventory")
