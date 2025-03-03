from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class ProductModel(Base):
    __tablename__ = 'products'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    categoryId = Column(Integer, ForeignKey("categories.id"), nullable=False)
    stock = Column(Integer, default=0)
    size = Column(Float, nullable=True)
    measurement_unit = Column(Integer, nullable=True)
    price = Column(Float, nullable=False)
    image = Column(String, nullable=True)  # URL stored as string
    
    # Relationships
    category = relationship("CategoryModel", back_populates="products")
    order_items = relationship("OrderItemModel", back_populates="product")
    inventory_items = relationship("InventoryModel", back_populates="product")
