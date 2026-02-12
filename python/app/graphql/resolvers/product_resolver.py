import strawberry
from typing import List, Optional
from app.graphql.types import Product
from app.services.product_service import get_all_products, create_product, delete_product, update_product
from app.graphql.permissions.store_permissions import IsAdmin

@strawberry.type
class ProductQuery:
    @strawberry.field
    def products(self) -> List[Product]:
        return get_all_products()

@strawberry.type
class ProductMutation:
    @strawberry.mutation(permission_classes=[IsAdmin])
    def create_product(
        self,
        name: str,
        description: str,
        categoryId: int,
        image: Optional[str] = None
    ) -> Product:
        """Create a basic product without price (price is set in inventory)"""
        print(f"Creating product with image: {image}")  # Add logging
        return create_product(name, description, categoryId, image)

    @strawberry.mutation(permission_classes=[IsAdmin])
    def delete_product(self, product_id: int) -> bool:
        return delete_product(product_id)

    @strawberry.mutation(permission_classes=[IsAdmin])
    def update_product(
        self,
        product_id: int,
        name: str,
        description: str,
        categoryId: int,
        image: Optional[str] = None
    ) -> Product:
        """Update a product's details"""
        return update_product(product_id, name, description, categoryId, image)
