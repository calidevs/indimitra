from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean, ARRAY
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.db.custom_types.encrypted import EncryptedType
from app.config import PAYMENT_ENCRYPTION_SECRET_NAME

class StoreModel(Base):
    __tablename__ = 'store'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    radius = Column(Float, nullable=True)
    managerUserId = Column(Integer, ForeignKey("users.id"), nullable=False)
    email = Column(String, unique=True, nullable=False)
    mobile = Column(String, unique=True, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    disabled = Column(Boolean, default=False, nullable=False)
    description = Column(String, nullable=True)
    pincodes = Column(ARRAY(String), nullable=True)  # Array of pincode strings
    tnc = Column(String, nullable=True)  # Terms and conditions as dot-separated values
    storeDeliveryFee = Column(Float, nullable=True)  # Store's default delivery fee
    taxPercentage = Column(Float, nullable=True)  # Store's default tax percentage
    section_headers = Column(ARRAY(String), nullable=True)  # Array of section header strings
    display_field = Column(String, unique=True, nullable=False)  # Unique display field, required
    images = Column(ARRAY(String), nullable=True)  # Array of store image URLs
    subdomain = Column(String, unique=True, nullable=True, index=True)  # Unique subdomain for multi-tenancy (e.g., 'store1' for store1.indimitra.com)

    # Square payment integration - encrypted credentials
    square_access_token = Column(EncryptedType(PAYMENT_ENCRYPTION_SECRET_NAME), nullable=True)  # Store's Square API access token
    square_refresh_token = Column(EncryptedType(PAYMENT_ENCRYPTION_SECRET_NAME), nullable=True)  # Store's Square OAuth refresh token
    square_merchant_id = Column(EncryptedType(PAYMENT_ENCRYPTION_SECRET_NAME), nullable=True)  # Store's Square merchant identifier
    square_location_id = Column(EncryptedType(PAYMENT_ENCRYPTION_SECRET_NAME), nullable=True)  # Store's Square location ID
    square_application_id = Column(String, nullable=True)  # Store's Square application ID (public identifier)
    is_square_connected = Column(Boolean, default=False, nullable=False)  # Whether store has active Square connection

    # Store configuration flags
    cod_enabled = Column(Boolean, default=False, nullable=False)  # Whether store accepts Cash on Delivery
    whatsapp_number = Column(String, nullable=True)  # WhatsApp support number with country code

    # Relationships
    manager = relationship("UserModel", back_populates="stores")
    inventory = relationship("InventoryModel", back_populates="store")
    drivers = relationship("StoreDriverModel", back_populates="store")
    location_codes = relationship("StoreLocationCodeModel", back_populates="store")
    pickup_addresses = relationship("PickupAddressModel", back_populates="store")
    fees = relationship("FeesModel", back_populates="store")
