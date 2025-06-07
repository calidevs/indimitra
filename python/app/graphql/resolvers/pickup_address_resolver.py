import strawberry
from typing import List, Optional
from app.db.session import SessionLocal
from app.graphql.types import PickupAddress
from app.services.pickup_address_service import (
    create_pickup_address,
    update_pickup_address,
    delete_pickup_address,
    get_pickup_addresses_by_store
)

# Error and Response types
@strawberry.type
class PickupAddressError:
    """Error returned when a pickup address operation fails"""
    message: str

@strawberry.type
class PickupAddressResponse:
    """Response for pickup address mutations that can fail"""
    pickup_address: Optional[PickupAddress] = None
    error: Optional[PickupAddressError] = None

# Input types for mutations
@strawberry.input
class PickupAddressInput:
    store_id: int
    address: str

@strawberry.input
class UpdatePickupAddressInput:
    id: int
    address: Optional[str] = None

# Queries
@strawberry.type
class PickupAddressQuery:
    @strawberry.field
    def getPickupAddressesByStore(self, storeId: int) -> List[PickupAddress]:
        """Get all pickup addresses for a specific store"""
        return get_pickup_addresses_by_store(store_id=storeId)

# Mutations
@strawberry.type
class PickupAddressMutation:
    @strawberry.mutation
    def createPickupAddress(self, input: PickupAddressInput) -> PickupAddressResponse:
        """
        Create a new pickup address
        
        Args:
            input: Contains store_id and address
            
        Returns:
            Response with either the created pickup address or an error message
        """
        try:
            pickup_address = create_pickup_address(
                store_id=input.store_id,
                address=input.address
            )
            return PickupAddressResponse(pickup_address=pickup_address)
        except ValueError as e:
            return PickupAddressResponse(error=PickupAddressError(message=str(e)))
    
    @strawberry.mutation
    def updatePickupAddress(self, input: UpdatePickupAddressInput) -> PickupAddressResponse:
        """
        Update an existing pickup address
        
        Args:
            input: Contains id and optional address
            
        Returns:
            Response with either the updated pickup address or an error message
        """
        try:
            pickup_address = update_pickup_address(
                id=input.id,
                address=input.address
            )
            if not pickup_address:
                return PickupAddressResponse(
                    error=PickupAddressError(message=f"Pickup address with ID {input.id} not found")
                )
            return PickupAddressResponse(pickup_address=pickup_address)
        except ValueError as e:
            return PickupAddressResponse(error=PickupAddressError(message=str(e)))
    
    @strawberry.mutation
    def deletePickupAddress(self, id: int) -> bool:
        """
        Delete a pickup address
        
        Args:
            id: ID of the pickup address to delete
            
        Returns:
            True if deleted successfully, False if not found
        """
        try:
            return delete_pickup_address(id=id)
        except ValueError as e:
            raise Exception(str(e)) 