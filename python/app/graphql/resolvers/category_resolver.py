import strawberry
from typing import List, Optional
from app.graphql.types import Category
from app.services.category_service import (
    get_all_categories,
    get_category_by_id,
    create_category,
    update_category,
    delete_category
)
from app.graphql.resolvers.base_resolver import BaseProtectedResolver, public

@strawberry.type
class CategoryError:
    """Error returned when a category operation fails"""
    message: str

@strawberry.type
class CategoryResponse:
    """Response for category mutations that can fail"""
    category: Optional[Category] = None
    error: Optional[CategoryError] = None

@strawberry.type
class DeleteCategoryResponse:
    """Response for delete category mutation"""
    success: bool = False
    error: Optional[CategoryError] = None

@strawberry.type
class CategoryQuery(BaseProtectedResolver):
    @strawberry.field
    @public
    def categories(self) -> List[Category]:
        """Get all categories"""
        return get_all_categories()
    
    @strawberry.field
    @public
    def category(self, categoryId: int) -> Optional[Category]:
        """Get a category by ID"""
        return get_category_by_id(category_id=categoryId)

@strawberry.type
class CategoryMutation(BaseProtectedResolver):
    @strawberry.mutation
    def createCategory(self, name: str) -> CategoryResponse:
        """
        Create a new category
        
        Args:
            name: Name of the category
            
        Returns:
            Response with either the created category or an error message
        """
        try:
            new_category = create_category(name=name)
            return CategoryResponse(category=new_category)
        except ValueError as e:
            return CategoryResponse(error=CategoryError(message=str(e)))
    
    @strawberry.mutation
    def updateCategory(self, categoryId: int, name: str) -> CategoryResponse:
        """
        Update an existing category
        
        Args:
            categoryId: ID of the category to update
            name: New name for the category
            
        Returns:
            Response with either the updated category or an error message
        """
        try:
            updated_category = update_category(category_id=categoryId, name=name)
            if not updated_category:
                return CategoryResponse(
                    error=CategoryError(message=f"Category with ID {categoryId} not found")
                )
            return CategoryResponse(category=updated_category)
        except ValueError as e:
            return CategoryResponse(error=CategoryError(message=str(e)))
    
    @strawberry.mutation
    def deleteCategory(self, categoryId: int) -> DeleteCategoryResponse:
        """
        Delete a category
        
        Args:
            categoryId: ID of the category to delete
            
        Returns:
            Response with success status and optional error message
        """
        try:
            success = delete_category(category_id=categoryId)
            if not success:
                return DeleteCategoryResponse(
                    success=False,
                    error=CategoryError(message=f"Category with ID {categoryId} not found")
                )
            return DeleteCategoryResponse(success=True)
        except ValueError as e:
            return DeleteCategoryResponse(
                success=False,
                error=CategoryError(message=str(e))
            ) 