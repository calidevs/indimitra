from typing import List, Optional
from app.db.session import SessionLocal
from app.db.models.store_location_code import StoreLocationCodeModel

def create_store_location_code(store_id: int, location: str, code: str) -> StoreLocationCodeModel:
    """
    Create a new store location code entry.
    
    Args:
        store_id: ID of the store
        location: Location name/description
        code: Location code
        
    Returns:
        The created StoreLocationCodeModel instance
    """
    db = SessionLocal()
    try:
        location_code = StoreLocationCodeModel(
            store_id=store_id,
            location=location,
            code=code
        )
        db.add(location_code)
        db.commit()
        db.refresh(location_code)
        return location_code
    finally:
        db.close()

def update_store_location_code(id: int, location: Optional[str] = None, code: Optional[str] = None) -> Optional[StoreLocationCodeModel]:
    """
    Update an existing store location code entry.
    
    Args:
        id: ID of the location code entry to update
        location: New location name/description (optional)
        code: New location code (optional)
        
    Returns:
        The updated StoreLocationCodeModel instance, or None if not found
    """
    db = SessionLocal()
    try:
        location_code = db.query(StoreLocationCodeModel).filter(StoreLocationCodeModel.id == id).first()
        if not location_code:
            return None
            
        if location is not None:
            location_code.location = location
        if code is not None:
            location_code.code = code
            
        db.commit()
        db.refresh(location_code)
        return location_code
    finally:
        db.close()

def delete_store_location_code(id: int) -> bool:
    """
    Delete a store location code entry.
    
    Args:
        id: ID of the location code entry to delete
        
    Returns:
        True if deleted successfully, False if not found
    """
    db = SessionLocal()
    try:
        location_code = db.query(StoreLocationCodeModel).filter(StoreLocationCodeModel.id == id).first()
        if not location_code:
            return False
            
        db.delete(location_code)
        db.commit()
        return True
    finally:
        db.close()

def get_store_location_codes_by_store(store_id: int) -> List[StoreLocationCodeModel]:
    """
    Get all location codes for a specific store.
    
    Args:
        store_id: ID of the store
        
    Returns:
        List of StoreLocationCodeModel instances for the store
    """
    db = SessionLocal()
    try:
        return db.query(StoreLocationCodeModel).filter(StoreLocationCodeModel.store_id == store_id).all()
    finally:
        db.close() 