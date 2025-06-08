import strawberry
from typing import List, Optional
from app.db.session import SessionLocal
from app.graphql.types import Fee, FeeType
from app.services.fees_service import (
    create_fee,
    update_fee,
    delete_fee,
    get_fees_by_store
)
import enum

@strawberry.enum
class FeeTypeEnum(enum.Enum):
    """Enum for fee types"""
    DELIVERY = "delivery"
    PICKUP = "pickup"

# Error and Response types
@strawberry.type
class FeeError:
    """Error returned when a fee operation fails"""
    message: str

@strawberry.type
class FeeResponse:
    """Response for fee mutations that can fail"""
    fee: Optional[Fee] = None
    error: Optional[FeeError] = None

# Input types for mutations
@strawberry.input
class CreateFeeInput:
    store_id: int
    fee_rate: float
    fee_currency: str
    type: FeeTypeEnum
    limit: Optional[float] = None

@strawberry.input
class UpdateFeeInput:
    id: int
    fee_rate: Optional[float] = None
    fee_currency: Optional[str] = None
    type: Optional[FeeTypeEnum] = None
    limit: Optional[float] = None

# Queries
@strawberry.type
class FeeQuery:
    @strawberry.field
    def getFeesByStore(self, storeId: int) -> List[Fee]:
        """Get all fees for a specific store"""
        return get_fees_by_store(store_id=storeId)

# Mutations
@strawberry.type
class FeeMutation:
    @strawberry.mutation
    def createFee(self, input: CreateFeeInput) -> FeeResponse:
        """
        Create a new fee
        
        Args:
            input: Contains store_id, fee_rate, fee_currency, type, and optional limit
            
        Returns:
            Response with either the created fee or an error message
        """
        try:
            fee = create_fee(
                store_id=input.store_id,
                fee_rate=input.fee_rate,
                fee_currency=input.fee_currency,
                type=input.type.value,
                limit=input.limit
            )
            return FeeResponse(fee=fee)
        except ValueError as e:
            return FeeResponse(error=FeeError(message=str(e)))
    
    @strawberry.mutation
    def updateFee(self, input: UpdateFeeInput) -> FeeResponse:
        """
        Update an existing fee
        
        Args:
            input: Contains id and optional fee_rate, fee_currency, type, and limit
            
        Returns:
            Response with either the updated fee or an error message
        """
        try:
            fee = update_fee(
                id=input.id,
                fee_rate=input.fee_rate,
                fee_currency=input.fee_currency,
                type=input.type.value if input.type else None,
                limit=input.limit
            )
            if not fee:
                return FeeResponse(
                    error=FeeError(message=f"Fee with ID {input.id} not found")
                )
            return FeeResponse(fee=fee)
        except ValueError as e:
            return FeeResponse(error=FeeError(message=str(e)))
    
    @strawberry.mutation
    def deleteFee(self, id: int) -> bool:
        """
        Delete a fee
        
        Args:
            id: ID of the fee to delete
            
        Returns:
            True if deleted successfully, False if not found
        """
        try:
            return delete_fee(id=id)
        except ValueError as e:
            raise Exception(str(e)) 