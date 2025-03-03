import strawberry
from typing import List
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
        price: float,
        categoryId: int,
        stock: int = 0
    ) -> Product:
        return create_product(name, price, categoryId, stock)

    @strawberry.mutation
    def delete_product(self, product_id: int) -> bool:
        return delete_product(product_id)
