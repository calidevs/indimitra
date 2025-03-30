from app.db.session import SessionLocal
from app.db.models.address import AddressModel


def create_address(address: str, user_id: int, is_primary: bool = False) -> AddressModel:
    db = SessionLocal()
    try:
        # Check if this address already exists for this user
        existing_address = db.query(AddressModel).filter(
            AddressModel.userId == user_id,
            AddressModel.address == address
        ).first()
        
        if existing_address:
            # Address already exists, return the existing one
            # Optionally: Update primary status if needed
            if is_primary and not existing_address.isPrimary:
                # Make this address primary and reset others
                db.query(AddressModel).filter(
                    AddressModel.userId == user_id,
                    AddressModel.id != existing_address.id
                ).update({"isPrimary": False})
                
                existing_address.isPrimary = True
                db.commit()
                db.refresh(existing_address)
            
            return existing_address
        
        # If we need to make this address primary, unset other primary addresses
        if is_primary:
            db.query(AddressModel).filter(
                AddressModel.userId == user_id
            ).update({"isPrimary": False})
        
        # Create new address
        new_address = AddressModel(
            address=address,
            userId=user_id,
            isPrimary=is_primary
        )
        db.add(new_address)
        db.commit()
        db.refresh(new_address)
        return new_address
    finally:
        db.close()


def get_addresses_by_user(user_id: int):
    db = SessionLocal()
    try:
        return db.query(AddressModel).filter(AddressModel.userId == user_id).all()
    finally:
        db.close()


def update_address(address_id: int, address: str = None, is_primary: bool = None) -> AddressModel | None:
    db = SessionLocal()
    try:
        # Find the address to update
        addr = db.query(AddressModel).get(address_id)
        if not addr:
            return None

        # If we're updating the address text, check for duplicates
        if address is not None and address != addr.address:
            # Check if the new address text already exists for this user
            existing_address = db.query(AddressModel).filter(
                AddressModel.userId == addr.userId,
                AddressModel.address == address,
                AddressModel.id != addr.id  # Exclude current address
            ).first()
            
            if existing_address:
                # Instead of creating a duplicate, we could:
                # 1. Return the existing address (current implementation)
                # 2. Raise an error
                # 3. Merge the records
                
                # For now, let's handle primary flag transfer and return existing
                if is_primary and is_primary is True:
                    # Update primary status on the existing address
                    db.query(AddressModel).filter(
                        AddressModel.userId == addr.userId,
                        AddressModel.id != existing_address.id
                    ).update({"isPrimary": False})
                    
                    existing_address.isPrimary = True
                    
                    # Delete the current address since we're effectively merging
                    db.delete(addr)
                    db.commit()
                    db.refresh(existing_address)
                    
                    return existing_address
                else:
                    # Just return the existing address without changes
                    return existing_address
            
            # No duplicate found, update the address text
            addr.address = address
            
        # Handle primary address logic
        if is_primary is not None and is_primary is True:
            # If we're setting this address as primary, unset primary flag on all other addresses for this user
            db.query(AddressModel).filter(
                AddressModel.userId == addr.userId,
                AddressModel.id != addr.id
            ).update({"isPrimary": False})
            
            # Set this address as primary
            addr.isPrimary = True
        elif is_primary is not None:
            # Just set the provided value
            addr.isPrimary = is_primary

        db.commit()
        db.refresh(addr)
        return addr
    finally:
        db.close()


def delete_address(address_id: int) -> bool:
    db = SessionLocal()
    try:
        addr = db.query(AddressModel).get(address_id)
        if not addr:
            return False

        db.delete(addr)
        db.commit()
        return True
    finally:
        db.close()
