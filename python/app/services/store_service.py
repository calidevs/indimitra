from app.db.session import SessionLocal
from app.db.models.store import StoreModel
from app.db.models.inventory import InventoryModel
from typing import List, Optional
from sqlalchemy import and_

def get_all_stores(is_active: Optional[bool] = None, disabled: Optional[bool] = None):
    """Get all stores in the system with optional filters"""
    db = SessionLocal()
    try:
        query = db.query(StoreModel)
        
        # Apply filters if provided
        if is_active is not None:
            query = query.filter(StoreModel.is_active == is_active)
        if disabled is not None:
            query = query.filter(StoreModel.disabled == disabled)
            
        return query.all()
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

def create_store(
    name: str, 
    address: str, 
    manager_user_id: int, 
    email: str, 
    radius: Optional[float] = None, 
    mobile: Optional[str] = None,
    description: Optional[str] = None,
    tnc: Optional[str] = None,
    store_delivery_fee: Optional[float] = None,
    tax_percentage: Optional[float] = None,
    pincodes: Optional[List[str]] = None,
    is_active: Optional[bool] = True,
    disabled: Optional[bool] = False
) -> StoreModel:
    """Create a new store"""
    db = SessionLocal()
    try:
        # Validate required fields
        if not name or name.strip() == "":
            raise ValueError("Store name cannot be empty")
        if not address or address.strip() == "":
            raise ValueError("Store address cannot be empty")
        if not email or email.strip() == "":
            raise ValueError("Store email cannot be empty")
            
        # Normalize input (trim whitespace)
        name = name.strip()
        address = address.strip()
        email = email.strip()
        if mobile:
            mobile = mobile.strip()
        if description:
            description = description.strip()
        if tnc:
            tnc = tnc.strip()
        
        # Check if a store with the same name already exists
        existing_store = db.query(StoreModel).filter(StoreModel.name == name).first()
        if existing_store:
            raise ValueError(f"A store with the name '{name}' already exists")
        
        # Check if a store with the same email already exists
        existing_email = db.query(StoreModel).filter(StoreModel.email == email).first()
        if existing_email:
            raise ValueError(f"A store with the email '{email}' already exists")
            
        # Check if a store with the same mobile already exists (if mobile is provided)
        if mobile:
            existing_mobile = db.query(StoreModel).filter(StoreModel.mobile == mobile).first()
            if existing_mobile:
                raise ValueError(f"A store with the mobile number '{mobile}' already exists")
        
        # Create the new store
        store = StoreModel(
            name=name,
            address=address,
            email=email,
            mobile=mobile,
            managerUserId=manager_user_id,
            radius=radius,
            description=description,
            tnc=tnc,
            storeDeliveryFee=store_delivery_fee,
            taxPercentage=tax_percentage,
            pincodes=pincodes,
            is_active=is_active,
            disabled=disabled
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
    email: Optional[str] = None,
    mobile: Optional[str] = None,
    manager_user_id: Optional[int] = None, 
    radius: Optional[float] = None,
    is_active: Optional[bool] = None,
    disabled: Optional[bool] = None,
    description: Optional[str] = None,
    pincodes: Optional[List[str]] = None,
    tnc: Optional[str] = None,
    store_delivery_fee: Optional[float] = None,
    tax_percentage: Optional[float] = None
) -> Optional[StoreModel]:
    """Update an existing store"""
    db = SessionLocal()
    try:
        # Find the store
        store = db.query(StoreModel).filter(StoreModel.id == store_id).first()
        if not store:
            return None
        
        # Validate and normalize inputs
        if name is not None:
            if name.strip() == "":
                raise ValueError("Store name cannot be empty")
            name = name.strip()
            
            # Check if the new name is already taken by another store
            if name != store.name:
                existing = db.query(StoreModel).filter(
                    StoreModel.name == name,
                    StoreModel.id != store_id
                ).first()
                if existing:
                    raise ValueError(f"A store with the name '{name}' already exists")
            store.name = name
        
        # Update address if provided
        if address is not None:
            if address.strip() == "":
                raise ValueError("Store address cannot be empty")
            store.address = address.strip()
        
        # Update email if provided
        if email is not None:
            if email.strip() == "":
                raise ValueError("Store email cannot be empty")
            email = email.strip()
            
            # Check if the new email is already taken by another store
            if email != store.email:
                existing = db.query(StoreModel).filter(
                    StoreModel.email == email,
                    StoreModel.id != store_id
                ).first()
                if existing:
                    raise ValueError(f"A store with the email '{email}' already exists")
            store.email = email
        
        # Update mobile if provided
        if mobile is not None:
            # Allow clearing mobile by setting to empty string
            if mobile.strip() == "":
                store.mobile = None
            else:
                mobile = mobile.strip()
                
                # Check if the new mobile is already taken by another store
                if mobile != store.mobile:
                    existing = db.query(StoreModel).filter(
                        StoreModel.mobile == mobile,
                        StoreModel.id != store_id
                    ).first()
                    if existing:
                        raise ValueError(f"A store with the mobile number '{mobile}' already exists")
                store.mobile = mobile
            
        # Update other fields if provided
        if manager_user_id:
            store.managerUserId = manager_user_id
        if radius is not None:  # Allow setting radius to 0
            store.radius = radius
        if is_active is not None:
            store.is_active = is_active
        if disabled is not None:
            store.disabled = disabled
        if description is not None:
            store.description = description.strip() if description.strip() else None
        if pincodes is not None:
            # Validate and normalize pincodes
            if pincodes:
                # Remove any empty strings and strip whitespace
                store.pincodes = [p.strip() for p in pincodes if p.strip()]
            else:
                store.pincodes = None
        if tnc is not None:
            store.tnc = tnc.strip() if tnc.strip() else None
        if store_delivery_fee is not None:
            store.storeDeliveryFee = store_delivery_fee
        if tax_percentage is not None:
            store.taxPercentage = tax_percentage
        
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
        
        # Instead of deleting, mark as disabled and inactive
        store.disabled = True
        store.is_active = False
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

def update_store_status(store_id: int, is_active: Optional[bool] = None, disabled: Optional[bool] = None) -> Optional[StoreModel]:
    """Update store status fields"""
    db = SessionLocal()
    try:
        store = db.query(StoreModel).filter(StoreModel.id == store_id).first()
        if not store:
            return None
            
        if is_active is not None:
            store.is_active = is_active
        if disabled is not None:
            store.disabled = disabled
            
        db.commit()
        db.refresh(store)
        return store
    finally:
        db.close()

def toggle_store_active(store_id: int) -> Optional[StoreModel]:
    """Toggle the is_active status of a store"""
    store = get_store_by_id(store_id)
    if not store:
        return None
    return update_store_status(store_id, is_active=not store.is_active)

def toggle_store_disabled(store_id: int) -> Optional[StoreModel]:
    """Toggle the disabled status of a store"""
    store = get_store_by_id(store_id)
    if not store:
        return None
    return update_store_status(store_id, disabled=not store.disabled)

def update_store_delivery_fee(store_id: int, store_delivery_fee: Optional[float] = None) -> Optional[StoreModel]:
    """
    Update a store's delivery fee
    
    Args:
        store_id: The ID of the store to update
        store_delivery_fee: The new delivery fee (can be None to remove the fee)
    
    Returns:
        The updated store, or None if the store doesn't exist
    """
    return update_store(store_id, store_delivery_fee=store_delivery_fee)

def update_store_tax_percentage(store_id: int, tax_percentage: Optional[float] = None) -> Optional[StoreModel]:
    """
    Update a store's tax percentage
    
    Args:
        store_id: The ID of the store to update
        tax_percentage: The new tax percentage (can be None to remove the tax)
    
    Returns:
        The updated store, or None if the store doesn't exist
    """
    return update_store(store_id, tax_percentage=tax_percentage) 