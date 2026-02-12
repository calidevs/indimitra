from datetime import datetime
from sqlalchemy import Column, Integer, ForeignKey, DateTime, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base import Base


class SavedCartModel(Base):
    __tablename__ = 'saved_carts'

    id = Column(Integer, primary_key=True, index=True)
    userId = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    storeId = Column(Integer, ForeignKey("store.id"), nullable=False, index=True)
    cartData = Column(JSON, nullable=False, default={})
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint('userId', 'storeId', name='uq_user_store_cart'),
    )

    user = relationship("UserModel", backref="saved_carts")
    store = relationship("StoreModel", backref="saved_carts")
