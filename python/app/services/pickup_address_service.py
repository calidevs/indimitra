from typing import List, Optional
from app.db.session import SessionLocal
from app.db.models.pickup_address import PickupAddressModel

def create_pickup_address(store_id: int, address: str) -> PickupAddressModel:
    """
    Create a new pickup address for a store.
    
    Args:
        store_id: ID of the store
        address: Pickup address
        
    Returns:
        The created PickupAddressModel instance
    """
    db = SessionLocal()
    try:
        pickup_address = PickupAddressModel(
            store_id=store_id,
            address=address
        )
        db.add(pickup_address)
        db.commit()
        db.refresh(pickup_address)
        return pickup_address
    finally:
        db.close()

def update_pickup_address(id: int, address: Optional[str] = None) -> Optional[PickupAddressModel]:
    """
    Update an existing pickup address.
    
    Args:
        id: ID of the pickup address to update
        address: New address (optional)
        
    Returns:
        The updated PickupAddressModel instance, or None if not found
    """
    db = SessionLocal()
    try:
        pickup_address = db.query(PickupAddressModel).filter(PickupAddressModel.id == id).first()
        if not pickup_address:
            return None
            
        if address is not None:
            pickup_address.address = address
            
        db.commit()
        db.refresh(pickup_address)
        return pickup_address
    finally:
        db.close()

def delete_pickup_address(id: int) -> bool:
    """
    Delete a pickup address.
    
    Args:
        id: ID of the pickup address to delete
        
    Returns:
        True if deleted successfully, False if not found
    """
    db = SessionLocal()
    try:
        pickup_address = db.query(PickupAddressModel).filter(PickupAddressModel.id == id).first()
        if not pickup_address:
            return False
            
        db.delete(pickup_address)
        db.commit()
        return True
    finally:
        db.close()

def get_pickup_addresses_by_store(store_id: int) -> List[PickupAddressModel]:
    """
    Get all pickup addresses for a specific store.
    
    Args:
        store_id: ID of the store
        
    Returns:
        List of PickupAddressModel instances for the store
    """
    db = SessionLocal()
    try:
        return db.query(PickupAddressModel).filter(PickupAddressModel.store_id == store_id).all()
    finally:
        db.close() 