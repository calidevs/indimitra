import strawberry
from typing import List
from graphql import GraphQLError
from app.services.product_service import get_all_products, create_product, delete_product as service_delete_product

@strawberry.type
class Product:
    id: int
    name: str
    price: float
    description: str
    category: str

@strawberry.type
class Query:
    @strawberry.field
    def products(self) -> List[Product]:
        products_db = get_all_products()
        return [
            Product(
                id=p.id,
                name=p.name,
                price=p.price,
                description=p.description,
                category=p.category,
            )
            for p in products_db
        ]

@strawberry.type
class Mutation:
    @strawberry.mutation
    def create_product(self, name: str, price: float, description: str, category: str) -> Product:
        product_model = create_product(name, price, description, category)
        return Product(
            id=product_model.id,
            name=product_model.name,
            price=product_model.price,
            description=product_model.description,
            category=product_model.category,
        )

    @strawberry.mutation
    def delete_product(self, product_id: int) -> bool:
        success = service_delete_product(product_id)
        if not success:
            raise GraphQLError(
                message="Product not found",
                extensions={"status_code": 404}
            )
        return True
