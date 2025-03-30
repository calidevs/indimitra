from app.db.session import SessionLocal
from app.db.models.product import ProductModel
from app.db.models.inventory import InventoryModel
from app.db.models.category import CategoryModel

def get_all_products():
    db = SessionLocal()
    try:
        return db.query(ProductModel).all()
    finally:
        db.close()

def create_product(name: str, description: str, category_id: int):
    db = SessionLocal()
    try:
        # Check if the category exists
        category = db.query(CategoryModel).get(category_id)
        if not category:
            raise ValueError(f"Category with ID {category_id} does not exist")
            
        product = ProductModel(
            name=name,
            description=description,
            categoryId=category_id
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
