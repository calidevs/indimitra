from app.db.session import SessionLocal
from app.db.models.inventory import InventoryModel
from app.db.models.store import StoreModel
from app.db.models.product import ProductModel
from app.db.models.meat_cut import MeatCutModel
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime


def _apply_meat_cut_ids(db, inventory: InventoryModel, meat_cut_ids: Optional[List[int]]) -> None:
    """Replace the inventory's cut_types with the given meat cut IDs.

    Passing None leaves cut_types untouched. Passing an empty list clears them.
    Raises ValueError if any provided ID does not exist.
    """
    if meat_cut_ids is None:
        return
    if len(meat_cut_ids) == 0:
        inventory.cut_types = []
        return

    unique_ids = list({int(i) for i in meat_cut_ids})
    meat_cuts = db.query(MeatCutModel).filter(MeatCutModel.id.in_(unique_ids)).all()
    if len(meat_cuts) != len(unique_ids):
        found_ids = {mc.id for mc in meat_cuts}
        missing = [i for i in unique_ids if i not in found_ids]
        raise ValueError(f"Meat cut IDs not found: {missing}")
    inventory.cut_types = meat_cuts

def get_inventory_by_store(store_id: int, is_listed: Optional[bool] = None) -> List[InventoryModel]:
    """Get inventory items for a specific store with optional is_listed filter"""
    db = SessionLocal()
    try:
        query = (
            db.query(InventoryModel)
            .options(selectinload(InventoryModel.cut_types))
            .filter(InventoryModel.storeId == store_id)
        )

        if is_listed is not None:
            query = query.filter(InventoryModel.is_listed == is_listed)

        return query.all()
    finally:
        db.close()

def get_inventory_item(store_id: int, product_id: int) -> Optional[InventoryModel]:
    """Get inventory details for a specific product in a specific store"""
    db = SessionLocal()
    try:
        return (
            db.query(InventoryModel)
            .options(selectinload(InventoryModel.cut_types))
            .filter(
                InventoryModel.storeId == store_id,
                InventoryModel.productId == product_id,
            )
            .first()
        )
    finally:
        db.close()

def add_product_to_inventory(
    store_id: int,
    product_id: int,
    price: Optional[float] = None,
    quantity: Optional[int] = None,
    measurement: Optional[int] = None,
    unit: Optional[str] = None,
    meat_cut_ids: Optional[List[int]] = None
) -> InventoryModel:
    """Add a product to a store's inventory with store-specific pricing"""
    db = SessionLocal()
    try:
        # Check if store exists
        store = db.query(StoreModel).get(store_id)
        if not store:
            raise ValueError(f"Store with ID {store_id} does not exist")

        # Check if product exists
        product = db.query(ProductModel).get(product_id)
        if not product:
            raise ValueError(f"Product with ID {product_id} does not exist")

        # Check if this product is already in inventory
        existing = db.query(InventoryModel).filter(
            InventoryModel.storeId == store_id,
            InventoryModel.productId == product_id
        ).first()

        if existing:
            # Update existing inventory - only update fields that are provided
            if price is not None:
                existing.price = price
            if quantity is not None:
                existing.quantity = quantity
            if measurement is not None:
                existing.measurement = measurement
            if unit is not None:
                existing.unit = unit
            _apply_meat_cut_ids(db, existing, meat_cut_ids)
            existing.updatedAt = datetime.utcnow()
            db.commit()
            db.refresh(existing)
            return existing
        else:
            # Create new inventory entry
            inventory_item = InventoryModel(
                storeId=store_id,
                productId=product_id,
                price=price,
                quantity=quantity,
                measurement=measurement,
                unit=unit
            )
            db.add(inventory_item)
            db.flush()
            _apply_meat_cut_ids(db, inventory_item, meat_cut_ids)
            db.commit()
            db.refresh(inventory_item)
            return inventory_item
    finally:
        db.close()

def update_inventory_quantity(store_id: int, product_id: int, quantity: Optional[int] = None) -> Optional[InventoryModel]:
    """Update the quantity of a product in inventory"""
    db = SessionLocal()
    try:
        inventory_item = db.query(InventoryModel).filter(
            InventoryModel.storeId == store_id,
            InventoryModel.productId == product_id
        ).first()
        
        if not inventory_item:
            return None
            
        # Only update if a value is provided
        if quantity is not None:
            inventory_item.quantity = quantity
            
        inventory_item.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(inventory_item)
        return inventory_item
    finally:
        db.close()

def update_inventory_price(store_id: int, product_id: int, price: Optional[float] = None) -> Optional[InventoryModel]:
    """Update the price of a product for a specific store"""
    db = SessionLocal()
    try:
        inventory_item = db.query(InventoryModel).filter(
            InventoryModel.storeId == store_id,
            InventoryModel.productId == product_id
        ).first()
        
        if not inventory_item:
            return None
            
        # Only update if a value is provided
        if price is not None:
            inventory_item.price = price
            
        inventory_item.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(inventory_item)
        return inventory_item
    finally:
        db.close()

def remove_from_inventory(store_id: int, product_id: int) -> bool:
    """Remove a product from a store's inventory"""
    db = SessionLocal()
    try:
        inventory_item = db.query(InventoryModel).filter(
            InventoryModel.storeId == store_id,
            InventoryModel.productId == product_id
        ).first()
        
        if not inventory_item:
            return False
            
        db.delete(inventory_item)
        db.commit()
        return True
    finally:
        db.close()

def update_inventory_item(
    inventory_id: int,
    price: Optional[float] = None,
    quantity: Optional[int] = None,
    is_listed: Optional[bool] = None,
    is_available: Optional[bool] = None,
    meat_cut_ids: Optional[List[int]] = None
) -> Optional[InventoryModel]:
    """Update an inventory item"""
    db = SessionLocal()
    try:
        inventory = (
            db.query(InventoryModel)
            .options(selectinload(InventoryModel.cut_types))
            .filter(InventoryModel.id == inventory_id)
            .first()
        )
        if not inventory:
            return None

        if price is not None:
            inventory.price = price
        if quantity is not None:
            inventory.quantity = quantity
        if is_listed is not None:
            inventory.is_listed = is_listed
        if is_available is not None:
            inventory.is_available = is_available

        _apply_meat_cut_ids(db, inventory, meat_cut_ids)

        db.commit()
        db.refresh(inventory)
        return inventory
    finally:
        db.close()
