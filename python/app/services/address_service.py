from app.db.session import SessionLocal
from app.db.models.address import AddressModel


def create_address(address: str, user_id: str, is_primary: bool = False) -> AddressModel:
    db = SessionLocal()
    try:
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


def get_addresses_by_user(user_id: str):
    db = SessionLocal()
    try:
        return db.query(AddressModel).filter(AddressModel.userId == user_id).all()
    finally:
        db.close()


def update_address(address_id: int, address: str = None, is_primary: bool = None) -> AddressModel | None:
    db = SessionLocal()
    try:
        addr = db.query(AddressModel).get(address_id)
        if not addr:
            return None

        if address is not None:
            addr.address = address
        if is_primary is not None:
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
