import strawberry
from typing import List, Optional
from app.graphql.types import MeatCut
from app.services.meat_cut_service import (
    get_all_meat_cuts,
    get_meat_cut_by_id,
    create_meat_cut,
    update_meat_cut,
    delete_meat_cut,
)


@strawberry.type
class MeatCutError:
    """Error returned when a meat cut operation fails"""
    message: str


@strawberry.type
class MeatCutResponse:
    """Response for meat cut mutations that can fail"""
    meatCut: Optional[MeatCut] = None
    error: Optional[MeatCutError] = None


@strawberry.type
class DeleteMeatCutResponse:
    """Response for delete meat cut mutation"""
    success: bool = False
    error: Optional[MeatCutError] = None


@strawberry.type
class MeatCutQuery:
    @strawberry.field
    def meatCuts(self) -> List[MeatCut]:
        """Get all meat cuts"""
        return get_all_meat_cuts()

    @strawberry.field
    def meatCut(self, meatCutId: int) -> Optional[MeatCut]:
        """Get a meat cut by ID"""
        return get_meat_cut_by_id(meat_cut_id=meatCutId)


@strawberry.type
class MeatCutMutation:
    @strawberry.mutation
    def createMeatCut(self, label: str, text: str) -> MeatCutResponse:
        """Create a new meat cut"""
        try:
            new_meat_cut = create_meat_cut(label=label, text=text)
            return MeatCutResponse(meatCut=new_meat_cut)
        except ValueError as e:
            return MeatCutResponse(error=MeatCutError(message=str(e)))

    @strawberry.mutation
    def updateMeatCut(self, meatCutId: int, label: str, text: str) -> MeatCutResponse:
        """Update an existing meat cut"""
        try:
            updated = update_meat_cut(meat_cut_id=meatCutId, label=label, text=text)
            if not updated:
                return MeatCutResponse(
                    error=MeatCutError(message=f"Meat cut with ID {meatCutId} not found")
                )
            return MeatCutResponse(meatCut=updated)
        except ValueError as e:
            return MeatCutResponse(error=MeatCutError(message=str(e)))

    @strawberry.mutation
    def deleteMeatCut(self, meatCutId: int) -> DeleteMeatCutResponse:
        """Delete a meat cut"""
        try:
            success = delete_meat_cut(meat_cut_id=meatCutId)
            if not success:
                return DeleteMeatCutResponse(
                    success=False,
                    error=MeatCutError(message=f"Meat cut with ID {meatCutId} not found"),
                )
            return DeleteMeatCutResponse(success=True)
        except ValueError as e:
            return DeleteMeatCutResponse(
                success=False,
                error=MeatCutError(message=str(e)),
            )
