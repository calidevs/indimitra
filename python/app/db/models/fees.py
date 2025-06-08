from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.db.base import Base
import enum
import strawberry

@strawberry.enum
class DBFeeType(enum.Enum):
    DELIVERY = "delivery"
    PICKUP = "pickup"

class FeesModel(Base):
    __tablename__ = 'fees'
    
    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("store.id"), nullable=False)
    fee_rate = Column(Float, nullable=False)
    fee_currency = Column(String, default="USD", nullable=False)
    type = Column(Enum(DBFeeType), nullable=False)
    limit = Column(Float, nullable=True)
    
    # Relationship
    store = relationship("StoreModel", back_populates="fees") 