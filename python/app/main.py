from fastapi import Depends, FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter
from strawberry_sqlalchemy_mapper import StrawberrySQLAlchemyLoader
from app.db.session import engine
from app.db.base import Base
from app.graphql.schema import schema
from app.api.routes.product import router as product_router
from app.api.routes.s3 import router as s3_router
from app.api.dependencies import get_db
from sqlalchemy.orm import Session
import logging
import os
from dotenv import load_dotenv
from app.utils.cognito import verify_cognito_token

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

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
async def get_context(
    request: Request,
    db: Session = Depends(get_db),
):
    auth_header = request.headers.get("Authorization")
    
    # Allow unauthenticated access to public queries
    if not auth_header:
        logger.warning("No Authorization header present")
        return {
            "sqlalchemy_loader": StrawberrySQLAlchemyLoader(bind=db),
            "current_user": None,
            "user_roles": []
        }

    if not auth_header.lower().startswith("bearer "):
        logger.error("Invalid Authorization header format")
        raise HTTPException(status_code=401, detail="Invalid authorization header format")

    token = auth_header[7:]  # strip 'Bearer '
    payload = verify_cognito_token(token)

    if not payload:
        logger.error("Invalid or expired token")
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    # Extract user information from token
    user_id = payload.get("sub")
    logger.info(f"Authenticated user: {user_id}")
    
    return {
        "sqlalchemy_loader": StrawberrySQLAlchemyLoader(bind=db),
        "current_user": user_id
    }

# Set up the GraphQL endpoint with playground controlled by environment variable
graphql_app = GraphQLRouter(
    schema, 
    context_getter=get_context,
    graphiql=True
)
app.include_router(graphql_app, prefix="/graphql")

# Include the S3 router
app.include_router(s3_router)