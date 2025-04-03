from typing import List, Optional
from sqlalchemy.exc import IntegrityError

from app.db.session import SessionLocal
from app.db.models.store_driver import StoreDriverModel
from app.db.models.user import UserModel, UserType
from app.db.models.store import StoreModel

def get_store_drivers(store_id: int) -> List[StoreDriverModel]:
    """
    Get all drivers assigned to a specific store
    
    Args:
        store_id: Store ID to get drivers for
        
    Returns:
        List of StoreDriverModel with driver information
    """
    db = SessionLocal()
    try:
        from sqlalchemy.orm import joinedload
        
        drivers = (
            db.query(StoreDriverModel)
            .filter(StoreDriverModel.storeId == store_id)
            .options(joinedload(StoreDriverModel.driver))
            .all()
        )
        
        return drivers
    finally:
        db.close()

def get_driver_stores(user_id: int) -> List[StoreDriverModel]:
    """
    Get all stores a specific driver is assigned to
    
    Args:
        user_id: User ID of the driver
        
    Returns:
        List of StoreDriverModel with store information
    """
    db = SessionLocal()
    try:
        from sqlalchemy.orm import joinedload
        
        stores = (
            db.query(StoreDriverModel)
            .filter(StoreDriverModel.userId == user_id)
            .options(joinedload(StoreDriverModel.store))
            .all()
        )
        
        return stores
    finally:
        db.close()

def assign_driver_to_store(user_id: int, store_id: int) -> Optional[StoreDriverModel]:
    """
    Assign a delivery driver to a store
    
    Args:
        user_id: User ID of the driver
        store_id: Store ID to assign the driver to
        
    Returns:
        StoreDriverModel if successful, None if the user is not a delivery driver
        or the store doesn't exist
    """
    db = SessionLocal()
    try:
        # Verify the user is a delivery driver
        user = db.query(UserModel).filter(
            UserModel.id == user_id, 
            UserModel.type == UserType.DELIVERY
        ).first()
        
        if not user:
            raise ValueError(f"User with ID {user_id} is not a delivery driver")
        
        # Verify the store exists
        store = db.query(StoreModel).filter(StoreModel.id == store_id).first()
        if not store:
            raise ValueError(f"Store with ID {store_id} does not exist")
        
        # Check if assignment already exists
        existing = db.query(StoreDriverModel).filter(
            StoreDriverModel.userId == user_id,
            StoreDriverModel.storeId == store_id
        ).first()
        
        if existing:
            return existing
        
        # Create the assignment
        store_driver = StoreDriverModel(
            userId=user_id,
            storeId=store_id
        )
        
        db.add(store_driver)
        db.commit()
        db.refresh(store_driver)
        
        return store_driver
    except IntegrityError:
        db.rollback()
        raise ValueError("Failed to assign driver to store due to a database constraint")
    finally:
        db.close()

def remove_driver_from_store(user_id: int, store_id: int) -> bool:
    """
    Remove a driver's assignment from a store
    
    Args:
        user_id: User ID of the driver
        store_id: Store ID to remove the driver from
        
    Returns:
        True if successful, False if the assignment doesn't exist
    """
    db = SessionLocal()
    try:
        # Find the assignment
        assignment = db.query(StoreDriverModel).filter(
            StoreDriverModel.userId == user_id,
            StoreDriverModel.storeId == store_id
        ).first()
        
        if not assignment:
            return False
        
        # Delete the assignment
        db.delete(assignment)
        db.commit()
        
        return True
    except Exception:
        db.rollback()
        return False
    finally:
        db.close() 