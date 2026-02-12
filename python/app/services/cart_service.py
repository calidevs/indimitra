from typing import Optional
from app.db.session import SessionLocal
from app.db.models.saved_cart import SavedCartModel


def save_cart(user_id: int, store_id: int, cart_data: dict) -> SavedCartModel:
    db = SessionLocal()
    try:
        existing = db.query(SavedCartModel).filter(
            SavedCartModel.userId == user_id,
            SavedCartModel.storeId == store_id
        ).first()

        if existing:
            existing.cartData = cart_data
            db.commit()
            db.refresh(existing)
            return existing

        new_cart = SavedCartModel(
            userId=user_id,
            storeId=store_id,
            cartData=cart_data
        )
        db.add(new_cart)
        db.commit()
        db.refresh(new_cart)
        return new_cart
    finally:
        db.close()


def get_saved_cart(user_id: int, store_id: int) -> Optional[SavedCartModel]:
    db = SessionLocal()
    try:
        return db.query(SavedCartModel).filter(
            SavedCartModel.userId == user_id,
            SavedCartModel.storeId == store_id
        ).first()
    finally:
        db.close()


def delete_saved_cart(user_id: int, store_id: int) -> bool:
    db = SessionLocal()
    try:
        cart = db.query(SavedCartModel).filter(
            SavedCartModel.userId == user_id,
            SavedCartModel.storeId == store_id
        ).first()
        if not cart:
            return False
        db.delete(cart)
        db.commit()
        return True
    finally:
        db.close()
