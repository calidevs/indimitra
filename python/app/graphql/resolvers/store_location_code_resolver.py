import strawberry
from typing import List, Optional
from app.db.session import SessionLocal
from app.graphql.types import StoreLocationCode
from app.services.store_location_code_service import (
    create_store_location_code,
    update_store_location_code,
    delete_store_location_code,
    get_store_location_codes_by_store
)

# Input types for mutations
@strawberry.input
class CreateStoreLocationCodeInput:
    store_id: int
    location: str
    code: str

@strawberry.input
class UpdateStoreLocationCodeInput:
    id: int
    location: Optional[str] = None
    code: Optional[str] = None

# Queries
@strawberry.type
class StoreLocationCodeQuery:
    @strawberry.field
    def getStoreLocationCodesByStore(self, storeId: int) -> List[StoreLocationCode]:
        """Get all location codes for a specific store"""
        return get_store_location_codes_by_store(store_id=storeId)

# Mutations
@strawberry.type
class StoreLocationCodeMutation:
    @strawberry.mutation
    def createStoreLocationCode(self, input: CreateStoreLocationCodeInput) -> StoreLocationCode:
        """Create a new store location code"""
        return create_store_location_code(
            store_id=input.store_id,
            location=input.location,
            code=input.code
        )
    
    @strawberry.mutation
    def updateStoreLocationCode(self, input: UpdateStoreLocationCodeInput) -> Optional[StoreLocationCode]:
        """Update an existing store location code"""
        return update_store_location_code(
            id=input.id,
            location=input.location,
            code=input.code
        )
    
    @strawberry.mutation
    def deleteStoreLocationCode(self, id: int) -> bool:
        """Delete a store location code"""
        return delete_store_location_code(id=id) 