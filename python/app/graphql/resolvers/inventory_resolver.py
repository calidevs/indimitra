import strawberry
from typing import List, Optional
from app.graphql.types import Product, Inventory
from app.services.inventory_service import (
    get_inventory_by_store,
    get_inventory_item,
    add_product_to_inventory,
    update_inventory_quantity,
    update_inventory_price,
    remove_from_inventory,
    update_inventory_item
)

@strawberry.type
class InventoryQuery:
    @strawberry.field
    def get_inventory_by_store(self, store_id: int, is_listed: Optional[bool] = None) -> List[Inventory]:
        """Get inventory items for a specific store with optional is_listed filter"""
        return get_inventory_by_store(store_id, is_listed)
    
    @strawberry.field
    def get_inventory_item(self, store_id: int, product_id: int) -> Optional[Inventory]:
        """Get inventory details for a specific product in a specific store"""
        return get_inventory_item(store_id, product_id)

@strawberry.type
class InventoryMutation:
    @strawberry.mutation
    def add_product_to_inventory(
        self,
        store_id: int,
        product_id: int,
        price: Optional[float] = None,
        quantity: Optional[int] = None,
        measurement: Optional[int] = None,
        unit: Optional[str] = None
    ) -> Inventory:
        """Add a product to a store's inventory with store-specific pricing"""
        return add_product_to_inventory(
            store_id, product_id, price, quantity, measurement, unit
        )
    
    @strawberry.mutation
    def update_inventory_quantity(
        self,
        store_id: int,
        product_id: int,
        quantity: Optional[int] = None
    ) -> Optional[Inventory]:
        """Update the quantity of a product in inventory"""
        return update_inventory_quantity(store_id, product_id, quantity)
    
    @strawberry.mutation
    def update_inventory_price(
        self,
        store_id: int,
        product_id: int,
        price: Optional[float] = None
    ) -> Optional[Inventory]:
        """Update the price of a product for a specific store"""
        return update_inventory_price(store_id, product_id, price)
    
    @strawberry.mutation
    def remove_from_inventory(
        self,
        store_id: int,
        product_id: int
    ) -> bool:
        """Remove a product from a store's inventory"""
        return remove_from_inventory(store_id, product_id)
    
    @strawberry.mutation
    def update_inventory_item(
        self,
        inventory_id: int,
        price: Optional[float] = None,
        quantity: Optional[int] = None,
        is_listed: Optional[bool] = None,
        is_available: Optional[bool] = None
    ) -> Optional[Inventory]:
        """Update an inventory item"""
        try:
            inventory = update_inventory_item(
                inventory_id,
                price,
                quantity,
                is_listed,
                is_available
            )
            if not inventory:
                raise Exception(f"Inventory item with ID {inventory_id} not found")
            return inventory
        except ValueError as e:
            raise Exception(str(e)) 