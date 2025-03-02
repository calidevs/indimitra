from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class CategoryModel(Base):
    __tablename__ = 'categories'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    createdByUserId = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    creator = relationship("UserModel", back_populates="categories")
    products = relationship("ProductModel", back_populates="category")
