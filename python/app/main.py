from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter
from app.db.session import engine
from app.db.base import Base
from app.graphql.schema import schema

from app.api.routes.product import router as product_router

app = FastAPI(title="Indimitra API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set up the GraphQL endpoint
graphql_app = GraphQLRouter(schema)
app.include_router(graphql_app, prefix="/graphql")

# Include the REST endpoints under a prefix (e.g., /api)
app.include_router(product_router, prefix="/api")

# Create tables on startup if they don’t exist yet
@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
