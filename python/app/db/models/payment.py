from datetime import datetime
from sqlalchemy import Column, Integer, Enum, String, Float, DateTime
from sqlalchemy.orm import relationship
from app.db.base import Base
import strawberry
import enum

@strawberry.enum
class PaymentType(enum.Enum):
    CASH = "CASH"
    SQUARE = "SQUARE"

@strawberry.enum
class PaymentStatus(enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

class PaymentModel(Base):
    __tablename__ = 'payment'

    id = Column(Integer, primary_key=True, index=True)
    type = Column(Enum(PaymentType), nullable=False)

    # Square-specific fields (nullable for CASH payments)
    square_payment_id = Column(String, nullable=True, unique=True)
    idempotency_key = Column(String, nullable=True, unique=True)
    amount = Column(Float, nullable=True)
    currency = Column(String, default="USD", nullable=True)
    status = Column(Enum(PaymentStatus), nullable=True)
    receipt_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    orders = relationship("OrderModel", back_populates="payment")
