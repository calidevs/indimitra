from app.db.session import SessionLocal
from app.db.models.store import StoreModel
from app.db.models.inventory import InventoryModel
from typing import List, Optional

def get_all_stores():
    """Get all stores in the system"""
    db = SessionLocal()
    try:
        return db.query(StoreModel).all()
    finally:
        db.close()

def get_store_by_id(store_id: int) -> Optional[StoreModel]:
    """Get a specific store by ID"""
    db = SessionLocal()
    try:
        return db.query(StoreModel).filter(StoreModel.id == store_id).first()
    finally:
        db.close()

def get_stores_by_manager(manager_user_id: int) -> List[StoreModel]:
    """Get all stores managed by a specific user"""
    db = SessionLocal()
    try:
        return db.query(StoreModel).filter(StoreModel.managerUserId == manager_user_id).all()
    finally:
        db.close()

def create_store(name: str, address: str, manager_user_id: int, radius: Optional[float] = None) -> StoreModel:
    """Create a new store"""
    db = SessionLocal()
    try:
        # Check if a store with the same name already exists
        existing_store = db.query(StoreModel).filter(StoreModel.name == name).first()
        if existing_store:
            raise ValueError(f"A store with the name '{name}' already exists")
        
        # Create the new store
        store = StoreModel(
            name=name,
            address=address,
            managerUserId=manager_user_id,
            radius=radius
        )
        db.add(store)
        db.commit()
        db.refresh(store)
        return store
    finally:
        db.close()

def update_store(
    store_id: int, 
    name: Optional[str] = None, 
    address: Optional[str] = None, 
    manager_user_id: Optional[int] = None, 
    radius: Optional[float] = None
) -> Optional[StoreModel]:
    """Update an existing store"""
    db = SessionLocal()
    try:
        # Find the store
        store = db.query(StoreModel).filter(StoreModel.id == store_id).first()
        if not store:
            return None
        
        # Check if the new name is already taken by another store
        if name and name != store.name:
            existing = db.query(StoreModel).filter(
                StoreModel.name == name,
                StoreModel.id != store_id
            ).first()
            if existing:
                raise ValueError(f"A store with the name '{name}' already exists")
            store.name = name
        
        # Update other fields if provided
        if address:
            store.address = address
        if manager_user_id:
            store.managerUserId = manager_user_id
        if radius is not None:  # Allow setting radius to 0
            store.radius = radius
        
        db.commit()
        db.refresh(store)
        return store
    finally:
        db.close()

def delete_store(store_id: int) -> bool:
    """Delete a store"""
    db = SessionLocal()
    try:
        # Find the store
        store = db.query(StoreModel).filter(StoreModel.id == store_id).first()
        if not store:
            return False
        
        # Check if store has inventory items
        inventory_count = db.query(InventoryModel).filter(InventoryModel.storeId == store_id).count()
        if inventory_count > 0:
            raise ValueError(f"Cannot delete store with ID {store_id} because it has {inventory_count} inventory items")
        
        # Delete the store
        db.delete(store)
        db.commit()
        return True
    finally:
        db.close()

def get_store_count() -> int:
    """Get total number of stores"""
    db = SessionLocal()
    try:
        return db.query(StoreModel).count()
    finally:
        db.close() 