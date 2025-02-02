from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from graphql import GraphQLError
from sqlalchemy import Integer, create_engine, Column, String, Float
from sqlalchemy.orm import sessionmaker, declarative_base
import strawberry
from strawberry.fastapi import GraphQLRouter
from typing import List

# Create the SQLAlchemy engine for Postgres
# replace db with localhost if you are spinning up fast api in local instead of docker
DATABASE_URL = "postgresql://indimitra:indimitra123@db:5432/indimitra"
engine = create_engine(DATABASE_URL)

# Create a session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a base class to define our models
Base = declarative_base()

# Define ProductModel that maps to 'products' table in the DB
class ProductModel(Base):
    __tablename__ = 'products'

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String)
    price = Column(Float)
    description = Column(String)
    category = Column(String)

# GraphQL Schema
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
        # Use a session to query the DB
        db = SessionLocal()
        try:
            products_db = db.query(ProductModel).all()  # returns a list of ProductModel
            # Convert SQLAlchemy models -> Strawberry types
            return [
                Product(
                    id=p.id,
                    name=p.name,
                    price=p.price,
                    description=p.description,
                    category=p.category
                )
                for p in products_db
            ]
        finally:
            db.close()

@strawberry.type
class Mutation:
    @strawberry.mutation
    def create_product(self,
        name: str,
        price: float,
        description: str,
        category: str) -> Product:
        db = SessionLocal()
        try:
            product_model = ProductModel(
                name=name,
                price=price,
                description=description,
                category=category
            )
            db.add(product_model)
            db.commit()
            db.refresh(product_model) # refresh the instance with the new data

            return Product(
                id=product_model.id,
                name=product_model.name,
                price=product_model.price,
                description=product_model.description,
                category=product_model.category
            )
        finally:
            db.close()

    @strawberry.mutation
    def delete_product(self, product_id: int) -> bool:
        db = SessionLocal()
        try:
            product = db.query(ProductModel).get(product_id)
            if not product:
                raise GraphQLError(
                message="Product not found",
                extensions={"status_code": 404}
            )

            db.delete(product)
            db.commit()
            return True
        finally:
            db.close()

schema = strawberry.Schema(query=Query, mutation=Mutation)
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

# Create tables on startup if they don’t exist yet
@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)