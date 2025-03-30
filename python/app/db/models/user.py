import strawberry
import enum
from sqlalchemy import Column, Integer, String, Boolean, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


@strawberry.enum
class UserType(enum.Enum):
    ADMIN = "ADMIN"
    USER = "USER"
    DELIVERY = "DELIVERY_AGENT"
    STORE_MANAGER = "STORE_MANAGER"

class UserModel(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)
    mobile = Column(String, unique=True, nullable=True)
    active = Column(Boolean, default=True)
    type = Column(Enum(UserType), nullable=False)
    referredBy = Column(Integer, ForeignKey("users.id"), nullable=True)
    referralId = Column(String, nullable=False)
    cognitoId = Column(String, nullable=False)
    
    # Relationships
    orders = relationship("OrderModel", back_populates="creator")
    addresses = relationship("AddressModel", back_populates="user")
    deliveries = relationship("DeliveryModel", back_populates="driver")
    stores = relationship("StoreModel", back_populates="manager")
    # Self-referential relationship:
    # 'referrer' is the user that referred this user.
    # 'referrals' will contain all users that were referred by this user.
    referrer = relationship(
        'UserModel',
        remote_side=[id],
        foreign_keys=[referredBy],
        backref="referrals"
    )
