from app.db.session import SessionLocal
from app.db.models.product import ProductModel

def get_all_products():
    db = SessionLocal()
    try:
        return db.query(ProductModel).all()
    finally:
        db.close()

def create_product(name: str, price: float, description: str, category: str):
    db = SessionLocal()
    try:
        product = ProductModel(
            name=name,
            price=price,
            description=description,
            category=category
        )
        db.add(product)
        db.commit()
        db.refresh(product)
        return product
    finally:
        db.close()

def delete_product(product_id: int) -> bool:
    db = SessionLocal()
    try:
        product = db.query(ProductModel).get(product_id)
        if not product:
            return False
        db.delete(product)
        db.commit()
        return True
    finally:
        db.close()
