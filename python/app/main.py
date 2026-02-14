from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from strawberry.fastapi import GraphQLRouter
from strawberry_sqlalchemy_mapper import StrawberrySQLAlchemyLoader
from slowapi.errors import RateLimitExceeded
from app.db.session import engine
from app.db.base import Base
from app.graphql.schema import schema
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from app.api.routes.product import router as product_router
from app.api.routes.s3 import router as s3_router
from app.api.routes.oauth import router as oauth_router
from app.api.dependencies import get_db
from app.services.token_refresh_service import setup_token_refresh_scheduler
from app.middleware.auth_middleware import CognitoAuthMiddleware
from app.middleware.rate_limit_middleware import limiter, RateLimitMiddleware
from sqlalchemy.orm import Session

app = FastAPI(title="Indimitra API")

# Configure rate limiter
app.state.limiter = limiter

# Rate limit exceeded handler
@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """Custom handler for rate limit exceeded errors"""
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Rate limit exceeded. Please try again later.",
            "retry_after": exc.retry_after if hasattr(exc, "retry_after") else None
        }
    )

# Startup event: Initialize token refresh scheduler
@app.on_event("startup")
async def startup_event():
    """Start background scheduler for Square token refresh"""
    setup_token_refresh_scheduler()

# Add CORS middleware with restricted origins
# Include both localhost and 127.0.0.1 for local development
default_origins = "http://localhost:3000,http://127.0.0.1:3000"
allowed_origins = os.getenv("ALLOWED_ORIGINS", default_origins).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add Cognito authentication middleware (AFTER CORS)
app.add_middleware(CognitoAuthMiddleware)

# Add rate limiting middleware (AFTER authentication so we can identify users)
# Limit: 120 requests per 60 seconds per user/IP
app.add_middleware(RateLimitMiddleware, rate_limit=120, window=60)

# Context getter that attaches the SQLAlchemy loader, request, and authenticated user to the context.
async def get_context(request: Request, db: Session = Depends(get_db)):
    return {
        "sqlalchemy_loader": StrawberrySQLAlchemyLoader(bind=db),
        "request": request,
        "user": getattr(request.state, "user", None)  # Authenticated user from middleware
    }

# Set up the GraphQL endpoint with playground controlled by environment variable
# IMPORTANT: Disable GraphiQL in production for security
# enable_graphiql = os.getenv("ENABLE_GRAPHIQL", "false").lower() == "true"
enable_graphiql = True
graphql_app = GraphQLRouter(
    schema,
    context_getter=get_context,
    graphiql=enable_graphiql
)
app.include_router(graphql_app, prefix="/graphql")

# Include the S3 router
app.include_router(s3_router)

# Include the OAuth router
app.include_router(oauth_router)