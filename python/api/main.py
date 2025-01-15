from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import strawberry
from strawberry.fastapi import GraphQLRouter
from typing import List

# GraphQL Schema
@strawberry.type
class Product:
    id: str
    name: str
    price: float
    description: str
    category: str

@strawberry.type
class Query:
    @strawberry.field
    def products(self) -> List[Product]:
        # Placeholder for database query
        return [
            Product(
                id="1",
                name="Basmati Rice",
                price=19.99,
                description="Premium long-grain basmati rice",
                category="Grains"
            )
        ]

schema = strawberry.Schema(query=Query)
graphql_app = GraphQLRouter(schema)

# FastAPI app
app = FastAPI(title="Indimitra API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add GraphQL endpoint
app.include_router(graphql_app, prefix="/graphql") 