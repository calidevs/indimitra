from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter
from strawberry_sqlalchemy_mapper import StrawberrySQLAlchemyLoader
from app.db.session import engine
from app.db.base import Base
from app.graphql.schema import schema

from app.api.routes.product import router as product_router
from app.api.dependencies import get_db
from sqlalchemy.orm import Session

app = FastAPI(title="Indimitra API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Context getter that attaches the SQLAlchemy loader to the context.
async def get_context(db: Session = Depends(get_db)):
    return {
        "sqlalchemy_loader": StrawberrySQLAlchemyLoader(bind=db)
    }

# Set up the GraphQL endpoint
graphql_app = GraphQLRouter(schema, context_getter=get_context)
app.include_router(graphql_app, prefix="/graphql")