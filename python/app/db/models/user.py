from sqlalchemy import Column, Integer, String, Boolean, Enum
from app.db.base import Base
import enum

class UserType(enum.Enum):
    ADMIN = "ADMIN"
    USER = "USER"
    DELIVERY = "DELIVERY"
    STORE_MANAGER = "STORE_MANAGER"

class UserModel(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    firstName = Column(String, nullable=False)
    lastName = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    mobile = Column(String, nullable=True)  # Storing as string for flexibility
    active = Column(Boolean, default=True)
    type = Column(Enum(UserType), nullable=False)
    referredBy = Column(String, nullable=True)
    referralId = Column(String, nullable=False)
