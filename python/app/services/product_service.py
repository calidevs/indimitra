from app.db.session import SessionLocal
from app.db.models.product import ProductModel
from app.db.models.inventory import InventoryModel
from app.db.models.category import CategoryModel
from typing import Optional

def get_all_products():
    db = SessionLocal()
    try:
        return db.query(ProductModel).all()
    finally:
        db.close()

def create_product(name: str, description: str, categoryId: int, image: Optional[str] = None):
    db = SessionLocal()
    try:
        # Validate required fields
        if not name or name.strip() == "":
            raise ValueError("Product name cannot be empty")
        if not description or description.strip() == "":
            raise ValueError("Product description cannot be empty")
            
        # Normalize input (trim whitespace)
        name = name.strip()
        description = description.strip()
        
        # Check if the category exists
        category = db.query(CategoryModel).get(categoryId)
        if not category:
            raise ValueError(f"Category with ID {categoryId} does not exist")
            
        print(f"Creating product with image: {image}")  # Add logging
            
        product = ProductModel(
            name=name,
            description=description,
            categoryId=categoryId,
            image=image
        )
        db.add(product)
        db.commit()
        db.refresh(product)
        print(f"Created product with image: {product.image}")  # Add logging
        return product
    finally:
        db.close()

def delete_product(product_id: int) -> bool:
    db = SessionLocal()
    try:
        # Check if product exists
        product = db.query(ProductModel).get(product_id)
        if not product:
            return False
            
        # Delete associated inventory items first
        db.query(InventoryModel).filter(InventoryModel.productId == product_id).delete()
        
        # Delete the product
        db.delete(product)
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        raise ValueError(f"Failed to delete product: {str(e)}")
    finally:
        db.close()

def update_product(product_id: int, name: str, description: str, categoryId: int, image: Optional[str] = None):
    db = SessionLocal()
    try:
        product = db.query(ProductModel).get(product_id)
        if not product:
            raise ValueError(f"Product with ID {product_id} does not exist")
        if not name or name.strip() == "":
            raise ValueError("Product name cannot be empty")
        if not description or description.strip() == "":
            raise ValueError("Product description cannot be empty")
        name = name.strip()
        description = description.strip()
        category = db.query(CategoryModel).get(categoryId)
        if not category:
            raise ValueError(f"Category with ID {categoryId} does not exist")
        product.name = name
        product.description = description
        product.categoryId = categoryId
        product.image = image
        db.commit()
        db.refresh(product)
        return product
    finally:
        db.close()
