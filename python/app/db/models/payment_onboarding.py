from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.db.base import Base
import enum
import strawberry

@strawberry.enum
class PaymentOnboardingStatus(enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

@strawberry.enum
class PaymentMethod(enum.Enum):
    BANK_TRANSFER = "BANK_TRANSFER"
    UPI = "UPI"
    PAYPAL = "PAYPAL"
    STRIPE = "STRIPE"

class PaymentOnboardingModel(Base):
    __tablename__ = 'payment_onboarding'

    id = Column(Integer, primary_key=True, index=True)
    storeId = Column(Integer, ForeignKey("store.id"), nullable=False)
    status = Column(SQLEnum(PaymentOnboardingStatus), nullable=False, default=PaymentOnboardingStatus.PENDING)
    paymentMethod = Column(SQLEnum(PaymentMethod), nullable=False)
    accountDetails = Column(JSON, nullable=True)  # Store account details as JSON
    documents = Column(JSON, nullable=True)  # Store document references as JSON array
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    store = relationship("StoreModel", backref="payment_onboardings")
