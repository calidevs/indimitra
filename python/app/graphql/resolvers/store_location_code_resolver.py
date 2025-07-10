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

# Error and Response types
@strawberry.type
class StoreLocationCodeError:
    """Error returned when a store location code operation fails"""
    message: str

@strawberry.type
class StoreLocationCodeResponse:
    """Response for store location code mutations that can fail"""
    location_code: Optional[StoreLocationCode] = None
    error: Optional[StoreLocationCodeError] = None

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
    def createStoreLocationCode(self, input: CreateStoreLocationCodeInput) -> StoreLocationCodeResponse:
        """
        Create a new store location code
        
        Args:
            input: Contains store_id, location, and code
            
        Returns:
            Response with either the created location code or an error message
        """
        try:
            location_code = create_store_location_code(
                store_id=input.store_id,
                location=input.location,
                code=input.code
            )
            return StoreLocationCodeResponse(location_code=location_code)
        except ValueError as e:
            return StoreLocationCodeResponse(error=StoreLocationCodeError(message=str(e)))
    
    @strawberry.mutation
    def updateStoreLocationCode(self, input: UpdateStoreLocationCodeInput) -> StoreLocationCodeResponse:
        """
        Update an existing store location code
        
        Args:
            input: Contains id and optional location and code
            
        Returns:
            Response with either the updated location code or an error message
        """
        try:
            location_code = update_store_location_code(
                id=input.id,
                location=input.location,
                code=input.code
            )
            if not location_code:
                return StoreLocationCodeResponse(
                    error=StoreLocationCodeError(message=f"Location code with ID {input.id} not found")
                )
            return StoreLocationCodeResponse(location_code=location_code)
        except ValueError as e:
            return StoreLocationCodeResponse(error=StoreLocationCodeError(message=str(e)))
    
    @strawberry.mutation
    def deleteStoreLocationCode(self, id: int) -> bool:
        """
        Delete a store location code
        
        Args:
            id: ID of the location code to delete
            
        Returns:
            True if deleted successfully, False if not found
        """
        try:
            return delete_store_location_code(id=id)
        except ValueError as e:
            raise Exception(str(e)) 