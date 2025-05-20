import strawberry
from typing import List, Optional
from app.graphql.types import Product
from app.services.product_service import get_all_products, create_product, delete_product

@strawberry.type
class ProductQuery:
    @strawberry.field
    def products(self) -> List[Product]:
        return get_all_products()

@strawberry.type
class ProductMutation:
    @strawberry.mutation
    def create_product(
        self,
        name: str,
        description: str,
        category_id: int,
        image: Optional[str] = None
    ) -> Product:
        """Create a basic product without price (price is set in inventory)"""
        return create_product(name, description, category_id, image)

    @strawberry.mutation
    def delete_product(self, product_id: int) -> bool:
        return delete_product(product_id)
