from typing import List, Optional
from sqlalchemy.exc import IntegrityError
from app.db.session import SessionLocal
from app.db.models.category import CategoryModel

def get_all_categories() -> List[CategoryModel]:
    """
    Get all categories
    
    Returns:
        List of all categories
    """
    db = SessionLocal()
    try:
        return db.query(CategoryModel).all()
    finally:
        db.close()

def get_category_by_id(category_id: int) -> Optional[CategoryModel]:
    """
    Get a category by ID
    
    Args:
        category_id: ID of the category to retrieve
        
    Returns:
        The category or None if not found
    """
    db = SessionLocal()
    try:
        return db.query(CategoryModel).filter(CategoryModel.id == category_id).first()
    finally:
        db.close()

def create_category(name: str) -> CategoryModel:
    """
    Create a new category
    
    Args:
        name: Name of the category
        
    Returns:
        The created category
        
    Raises:
        ValueError: If a category with the same name already exists
    """
    db = SessionLocal()
    try:
        # Check if category with the same name already exists
        existing = db.query(CategoryModel).filter(CategoryModel.name == name).first()
        if existing:
            raise ValueError(f"Category with name '{name}' already exists")
        
        # Create new category
        category = CategoryModel(name=name)
        db.add(category)
        db.commit()
        db.refresh(category)
        return category
    except IntegrityError:
        db.rollback()
        raise ValueError(f"Failed to create category - database integrity error")
    finally:
        db.close()

def update_category(category_id: int, name: str) -> Optional[CategoryModel]:
    """
    Update a category
    
    Args:
        category_id: ID of the category to update
        name: New name for the category
        
    Returns:
        The updated category or None if not found
        
    Raises:
        ValueError: If a different category with the same name already exists
    """
    db = SessionLocal()
    try:
        # Check if category exists
        category = db.query(CategoryModel).filter(CategoryModel.id == category_id).first()
        if not category:
            return None
            
        # Check if another category with the same name exists
        existing = db.query(CategoryModel).filter(
            CategoryModel.name == name, 
            CategoryModel.id != category_id
        ).first()
        if existing:
            raise ValueError(f"Another category with name '{name}' already exists")
            
        # Update category
        category.name = name
        db.commit()
        db.refresh(category)
        return category
    except IntegrityError:
        db.rollback()
        raise ValueError(f"Failed to update category - database integrity error")
    finally:
        db.close()

def delete_category(category_id: int) -> bool:
    """
    Delete a category
    
    Args:
        category_id: ID of the category to delete
        
    Returns:
        True if successful, False if category not found
        
    Raises:
        ValueError: If category has associated products and cannot be deleted
    """
    db = SessionLocal()
    try:
        # Check if category exists
        category = db.query(CategoryModel).filter(CategoryModel.id == category_id).first()
        if not category:
            return False
            
        # Check if category has associated products
        if category.products and len(category.products) > 0:
            raise ValueError(f"Cannot delete category with ID {category_id} because it has associated products")
            
        # Delete category
        db.delete(category)
        db.commit()
        return True
    except IntegrityError:
        db.rollback()
        raise ValueError(f"Failed to delete category - database integrity error")
    finally:
        db.close() 