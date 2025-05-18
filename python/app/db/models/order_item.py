from sqlalchemy import Column, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class OrderItemModel(Base):
    __tablename__ = 'order_items'
    
    id = Column(Integer, primary_key=True, index=True)
    productId = Column(Integer, ForeignKey("products.id"), nullable=False)
    inventoryId = Column(Integer, ForeignKey("inventory.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    orderId = Column(Integer, ForeignKey("orders.id"), nullable=False)
    orderAmount = Column(Float, nullable=False)
    updatedOrderitemsId = Column(Integer, ForeignKey("order_items.id"), nullable=True)
    
    # Relationships
    product = relationship("ProductModel", back_populates="order_items")
    order = relationship("OrderModel", back_populates="order_items")
    inventory = relationship("InventoryModel", back_populates="order_items")
    updated_order_item = relationship("OrderItemModel", remote_side=[id], uselist=False, 
                                      foreign_keys=[updatedOrderitemsId], backref="original_order_item")
