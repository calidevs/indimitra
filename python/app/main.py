from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter
from strawberry_sqlalchemy_mapper import StrawberrySQLAlchemyLoader
from app.db.session import engine
from app.db.base import Base
from app.graphql.schema import schema
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from app.api.routes.product import router as product_router
from app.api.routes.s3 import router as s3_router
from app.api.dependencies import get_db
from sqlalchemy.orm import Session

app = FastAPI(title="Indimitra API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Context getter that attaches the SQLAlchemy loader to the context.
async def get_context(db: Session = Depends(get_db)):
    return {
        "sqlalchemy_loader": StrawberrySQLAlchemyLoader(bind=db)
    }

# Set up the GraphQL endpoint with playground controlled by environment variable
graphql_app = GraphQLRouter(
    schema, 
    context_getter=get_context,
    graphiql=os.getenv("ENABLE_GRAPHQL_PLAYGROUND", "false").lower() == "true"
)
app.include_router(graphql_app, prefix="/graphql")

# Include the S3 router
app.include_router(s3_router)