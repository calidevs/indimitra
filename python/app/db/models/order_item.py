from sqlalchemy import Column, Integer, Float, ForeignKey, String, Boolean
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
    meatCutId = Column(Integer, ForeignKey("meat_cuts.id"), nullable=True)
    # Free-text per-item instructions the customer leaves on the cart page.
    instructions = Column(String, nullable=True)
    # If True, the store may substitute this item with a similar product when
    # unavailable. If False (the default), the item should be cancelled instead.
    allow_substitute = Column(Boolean, nullable=False, default=False)

    # Relationships
    product = relationship("ProductModel", back_populates="order_items")
    order = relationship("OrderModel", back_populates="order_items")
    inventory = relationship("InventoryModel", back_populates="order_items")
    meat_cut = relationship("MeatCutModel")
    updated_order_item = relationship("OrderItemModel", remote_side=[id], uselist=False,
                                      foreign_keys=[updatedOrderitemsId], backref="original_order_item")
