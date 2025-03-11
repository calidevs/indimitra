from sqlalchemy import Column, Integer, Enum
from sqlalchemy.orm import relationship
from app.db.base import Base
import strawberry
import enum

@strawberry.enum
class PaymentType(enum.Enum):
    CASH = "Cash"

class PaymentModel(Base):
    __tablename__ = 'payment'
    
    id = Column(Integer, primary_key=True, index=True)
    type = Column(Enum(PaymentType), nullable=False)
    
    # Relationships
    orders = relationship("OrderModel", back_populates="payment")
