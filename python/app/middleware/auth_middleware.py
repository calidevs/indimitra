"""
AWS Cognito JWT Authentication Middleware

Validates JWT tokens from AWS Cognito on every request and extracts user identity.
Excludes documentation endpoints and health checks from authentication.
"""

import os
from typing import Optional
from dataclasses import dataclass

from fastapi import Request, HTTPException, status, Depends
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.orm import Session
from cognitojwt import jwt_sync
import jwt

from app.config import COGNITO_USER_POOL_ID, COGNITO_USER_POOL_CLIENT_ID, AWS_REGION
from app.db.models.user import UserModel
from app.api.dependencies import get_db
import logging

logger = logging.getLogger(__name__)


@dataclass
class CognitoUser:
    """Represents an authenticated user from Cognito JWT"""
    cognito_id: str  # Cognito 'sub' claim
    email: str
    sub: str
    token_claims: dict


class CognitoAuthMiddleware(BaseHTTPMiddleware):
    """
    Middleware to validate AWS Cognito JWT tokens and extract user identity.

    Excluded paths (no authentication required):
    - /docs, /redoc, /openapi.json (API documentation)
    - /health (health check endpoint)
    """

    # Paths that don't require authentication at middleware level
    EXCLUDED_PATHS = {
        "/docs",
        "/redoc",
        "/openapi.json",
        "/health",
        "/oauth",  # OAuth callbacks from Square (no JWT token from external service)
    }

    # Paths that optionally validate JWT but don't require it
    # These paths rely on GraphQL permission classes for authorization
    OPTIONAL_AUTH_PATHS = {
        "/graphql",
    }

    async def dispatch(self, request: Request, call_next):
        # Skip authentication if SKIP_COGNITO_VALIDATION is enabled (development only)
        if os.getenv("SKIP_COGNITO_VALIDATION", "false").lower() == "true":
            return await call_next(request)

        # CRITICAL: Skip authentication for OPTIONS requests (CORS preflight)
        # Browsers send OPTIONS requests before actual requests with custom headers
        # These must pass through to allow CORS middleware to respond properly
        if request.method == "OPTIONS":
            return await call_next(request)

        # Skip authentication for excluded paths
        if any(request.url.path.startswith(path) for path in self.EXCLUDED_PATHS):
            return await call_next(request)

        # For optional auth paths (GraphQL), validate JWT if present but allow without it
        is_optional_auth = any(request.url.path.startswith(path) for path in self.OPTIONAL_AUTH_PATHS)

        # Extract JWT from Authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            # If this is an optional auth path, allow the request to proceed without authentication
            if is_optional_auth:
                return await call_next(request)
            # For other paths, require authentication
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Missing Authorization header"}
            )

        # Parse Bearer token
        try:
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                raise ValueError("Invalid authentication scheme")
        except ValueError:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Invalid Authorization header format. Expected: Bearer <token>"}
            )

        # Validate JWT with Cognito
        try:
            # Verify the JWT token with AWS Cognito
            verified_claims = jwt_sync.decode(
                token=token,
                region=AWS_REGION,
                userpool_id=COGNITO_USER_POOL_ID,
                app_client_id=COGNITO_USER_POOL_CLIENT_ID
            )

            # Extract user information from verified claims
            cognito_user = CognitoUser(
                cognito_id=verified_claims.get("sub"),
                email=verified_claims.get("email", ""),
                sub=verified_claims.get("sub"),
                token_claims=verified_claims
            )

            # Attach authenticated user to request state
            request.state.user = cognito_user

        except jwt.ExpiredSignatureError:
            # For optional auth paths, allow request but don't set user
            if is_optional_auth:
                return await call_next(request)
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Token has expired"}
            )
        except jwt.InvalidTokenError as e:
            # For optional auth paths, allow request but don't set user
            if is_optional_auth:
                return await call_next(request)
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": f"Invalid token: {str(e)}"}
            )
        except Exception as e:
            # For optional auth paths, allow request but don't set user
            if is_optional_auth:
                return await call_next(request)
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": f"Authentication failed: {str(e)}"}
            )

        # Process request
        response = await call_next(request)
        return response


def get_current_user(request: Request) -> CognitoUser:
    """
    FastAPI dependency to get the currently authenticated user.

    Usage in route handlers:
        @app.get("/protected")
        def protected_route(current_user: CognitoUser = Depends(get_current_user)):
            return {"user_id": current_user.cognito_id}

    Raises:
        HTTPException: If user is not authenticated
    """
    if not hasattr(request.state, "user"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    return request.state.user


def get_db_user(
    request: Request,
    db: Session = Depends(get_db)
) -> Optional[UserModel]:
    """
    FastAPI dependency to lazy-load the database user from Cognito ID.

    Usage in route handlers:
        @app.get("/profile")
        def get_profile(db_user: UserModel = Depends(get_db_user)):
            return {"name": db_user.name, "email": db_user.email}

    Returns:
        UserModel if found in database, None otherwise

    Raises:
        HTTPException: If user is not authenticated
    """
    current_user = get_current_user(request)

    # Query database for user by Cognito ID
    db_user = db.query(UserModel).filter(
        UserModel.cognitoId == current_user.cognito_id
    ).first()

    return db_user
