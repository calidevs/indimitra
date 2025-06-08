import strawberry
from typing import List, Optional
from app.graphql.types import Store
from app.services.store_service import (
    get_all_stores,
    get_store_by_id,
    get_stores_by_manager,
    create_store,
    update_store,
    delete_store,
    get_store_count,
    toggle_store_active,
    toggle_store_disabled,
    update_store_delivery_fee,
    update_store_tax_percentage
)

@strawberry.type
class StoreQuery:
    @strawberry.field
    def stores(self, is_active: Optional[bool] = None, disabled: Optional[bool] = None) -> List[Store]:
        """Get all stores with optional filters"""
        return get_all_stores(is_active, disabled)
    
    @strawberry.field
    def store(self, store_id: int) -> Optional[Store]:
        """Get a store by ID"""
        return get_store_by_id(store_id)
    
    @strawberry.field
    def stores_by_manager(self, manager_user_id: int) -> List[Store]:
        """Get all stores managed by a specific user"""
        return get_stores_by_manager(manager_user_id)
    
    @strawberry.field
    def store_count(self) -> int:
        """Get the total number of stores"""
        return get_store_count()

@strawberry.type
class StoreMutation:
    @strawberry.mutation
    def create_store(
        self,
        name: str,
        address: str,
        email: str,
        manager_user_id: int,
        display_field: str,
        radius: Optional[float] = None,
        mobile: Optional[str] = None,
        description: Optional[str] = None,
        tnc: Optional[str] = None,
        store_delivery_fee: Optional[float] = None,
        tax_percentage: Optional[float] = None,
        section_headers: Optional[List[str]] = None,
        pincodes: Optional[List[str]] = None
    ) -> Store:
        """
        Create a new store
        
        Args:
            name: Store name
            address: Store address
            email: Store email (must be unique)
            manager_user_id: ID of the user who manages this store
            display_field: Unique display field for the store
            radius: Optional delivery radius for the store
            mobile: Optional store phone number (must be unique if provided)
            description: Optional store description/timings/notes
            tnc: Optional terms and conditions as dot-separated values
            store_delivery_fee: Optional store delivery fee
            tax_percentage: Optional store tax percentage
            section_headers: Optional list of section header strings
            pincodes: Optional list of pincodes
        """
        try:
            return create_store(
                name, 
                address, 
                manager_user_id, 
                email,
                display_field,
                radius, 
                mobile, 
                description, 
                tnc,
                store_delivery_fee,
                tax_percentage,
                section_headers=section_headers,
                pincodes=pincodes
            )
        except ValueError as e:
            raise Exception(str(e))
    
    @strawberry.mutation
    def update_store(
        self,
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
        tax_percentage: Optional[float] = None,
        section_headers: Optional[List[str]] = None,
        display_field: Optional[str] = None
    ) -> Optional[Store]:
        """
        Update an existing store
        
        Args:
            store_id: ID of the store to update
            name: Optional new store name
            address: Optional new store address
            email: Optional new store email (must be unique)
            mobile: Optional new store phone number (must be unique if provided)
            manager_user_id: Optional new manager user ID
            radius: Optional new delivery radius
            is_active: Optional new active status
            disabled: Optional new disabled status
            description: Optional store description/timings/notes
            pincodes: Optional list of pincodes
            tnc: Optional terms and conditions as dot-separated values
            store_delivery_fee: Optional store delivery fee
            tax_percentage: Optional tax percentage
            section_headers: Optional list of section header strings
            display_field: Optional new display field (must be unique if provided)
        """
        try:
            store = update_store(
                store_id, 
                name, 
                address, 
                email, 
                mobile, 
                manager_user_id, 
                radius,
                is_active,
                disabled,
                description,
                pincodes,
                tnc,
                store_delivery_fee,
                tax_percentage,
                section_headers,
                display_field
            )
            if not store:
                raise Exception(f"Store with ID {store_id} not found")
            return store
        except ValueError as e:
            raise Exception(str(e))
    
    @strawberry.mutation
    def delete_store(self, store_id: int) -> bool:
        """Delete a store"""
        try:
            success = delete_store(store_id)
            if not success:
                raise Exception(f"Store with ID {store_id} not found")
            return success
        except ValueError as e:
            raise Exception(str(e))
    
    @strawberry.mutation
    def toggle_store_active(self, store_id: int) -> Optional[Store]:
        """Toggle the active status of a store"""
        store = toggle_store_active(store_id)
        if not store:
            raise Exception(f"Store with ID {store_id} not found")
        return store
    
    @strawberry.mutation
    def toggle_store_disabled(self, store_id: int) -> Optional[Store]:
        """Toggle the disabled status of a store"""
        store = toggle_store_disabled(store_id)
        if not store:
            raise Exception(f"Store with ID {store_id} not found")
        return store

    @strawberry.mutation
    def update_store_delivery_fee(self, store_id: int, store_delivery_fee: Optional[float] = None) -> Optional[Store]:
        """
        Update a store's delivery fee
        
        Args:
            store_id: ID of the store to update
            store_delivery_fee: New delivery fee (can be None to remove the fee)
        
        Returns:
            Updated store
        """
        store = update_store_delivery_fee(store_id, store_delivery_fee)
        if not store:
            raise Exception(f"Store with ID {store_id} not found")
        return store
    
    @strawberry.mutation
    def update_store_tax_percentage(self, store_id: int, tax_percentage: Optional[float] = None) -> Optional[Store]:
        """
        Update a store's tax percentage
        
        Args:
            store_id: ID of the store to update
            tax_percentage: New tax percentage (can be None to remove the tax)
        
        Returns:
            Updated store
        """
        store = update_store_tax_percentage(store_id, tax_percentage)
        if not store:
            raise Exception(f"Store with ID {store_id} not found")
        return store 