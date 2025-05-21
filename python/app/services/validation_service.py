from typing import Optional, List
import re
from app.db.session import SessionLocal
from app.db.models.store import StoreModel
from app.db.models.address import AddressModel

def extract_pincode_from_address(address: str) -> Optional[str]:
    """
    Extract the pincode/ZIP code from a US address string.
    
    Args:
        address: The complete address string
        
    Returns:
        The pincode/ZIP code if found, None otherwise
    """
    # Regular expression to match US zip codes (5 digits, optionally followed by a dash and 4 more digits)
    pincode_pattern = r'(\d{5})(?:-\d{4})?'
    
    # Find all matches in the address
    matches = re.findall(pincode_pattern, address)
    
    # Return the first match if any, otherwise None
    return matches[0] if matches else None

def validate_delivery_pincode(address_id: int, store_id: int) -> bool:
    """
    Validate if a delivery address pincode is in the list of pincodes served by a store.
    
    Args:
        address_id: The ID of the delivery address
        store_id: The ID of the store
        
    Returns:
        True if the pincode is valid for delivery, False otherwise
        
    Raises:
        ValueError: If the address or store doesn't exist, or if the pincode validation fails
    """
    db = SessionLocal()
    try:
        # Get the address
        address = db.query(AddressModel).filter(AddressModel.id == address_id).first()
        if not address:
            raise ValueError(f"Address with ID {address_id} not found")
        
        # Get the store
        store = db.query(StoreModel).filter(StoreModel.id == store_id).first()
        if not store:
            raise ValueError(f"Store with ID {store_id} not found")
        
        # If store doesn't have pincodes defined, accept all addresses
        if not store.pincodes:
            return True
        
        # Extract pincode from address
        pincode = extract_pincode_from_address(address.address)
        if not pincode:
            raise ValueError(f"Could not extract pincode from address: {address.address}")
        
        # Check if pincode is in store's pincodes
        if pincode not in store.pincodes:
            raise ValueError(f"Store does not deliver to pincode {pincode}. Supported pincodes: {', '.join(store.pincodes)}")
        
        return True
    finally:
        db.close() 