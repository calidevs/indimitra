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
    get_store_count
)

@strawberry.type
class StoreQuery:
    @strawberry.field
    def stores(self) -> List[Store]:
        """Get all stores"""
        return get_all_stores()
    
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
        manager_user_id: int,
        radius: Optional[float] = None
    ) -> Store:
        """Create a new store"""
        try:
            return create_store(name, address, manager_user_id, radius)
        except ValueError as e:
            raise Exception(str(e))
    
    @strawberry.mutation
    def update_store(
        self,
        store_id: int,
        name: Optional[str] = None,
        address: Optional[str] = None,
        manager_user_id: Optional[int] = None,
        radius: Optional[float] = None
    ) -> Optional[Store]:
        """Update an existing store"""
        try:
            store = update_store(store_id, name, address, manager_user_id, radius)
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