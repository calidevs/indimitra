from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class StoreLocationCodeModel(Base):
    __tablename__ = 'store_location_codes'
    
    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("store.id"), nullable=False)
    location = Column(String, nullable=False)
    code = Column(String, nullable=False)
    
    # Relationship
    store = relationship("StoreModel", back_populates="location_codes") 