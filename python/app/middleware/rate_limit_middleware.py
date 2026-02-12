"""
Rate Limiting Middleware

Prevents abuse by limiting request rates on all endpoints.
Uses authenticated user ID when available, otherwise IP address.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import time
from typing import Dict
from collections import defaultdict


def get_user_identifier(request: Request) -> str:
    """
    Get unique identifier for rate limiting.

    Priority:
    1. Use authenticated user's Cognito ID (from middleware)
    2. Fallback to IP address for unauthenticated requests

    This allows authenticated users to be tracked across IPs,
    while still providing protection for public endpoints.
    """
    if hasattr(request.state, 'user') and request.state.user:
        # Use authenticated user's Cognito ID
        return f"user:{request.state.user.cognito_id}"

    # Fallback to IP address
    return f"ip:{get_remote_address(request)}"


# Initialize rate limiter
# Default: 120 requests per minute per user/IP
# Production: Consider using Redis for distributed rate limiting
#   storage_uri="redis://localhost:6379"
limiter = Limiter(
    key_func=get_user_identifier,
    default_limits=["120/minute"],
    storage_uri="memory://"  # In-memory storage (not suitable for multi-process deployments)
)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Custom rate limiting middleware that applies to all routes including GraphQL.

    Tracks requests per user/IP and enforces 120 requests per minute limit.
    """

    def __init__(self, app, rate_limit: int = 120, window: int = 60):
        super().__init__(app)
        self.rate_limit = rate_limit  # Max requests per window
        self.window = window  # Time window in seconds
        self.requests: Dict[str, list] = defaultdict(list)  # Store timestamps per identifier

        # Paths that should bypass rate limiting
        self.excluded_paths = {
            "/docs",
            "/redoc",
            "/openapi.json",
            "/health"
        }

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for excluded paths
        if any(request.url.path.startswith(path) for path in self.excluded_paths):
            return await call_next(request)

        # Skip rate limiting for OPTIONS requests (CORS preflight)
        if request.method == "OPTIONS":
            return await call_next(request)

        # Get user identifier (after auth middleware has run)
        identifier = get_user_identifier(request)
        current_time = time.time()

        # Clean up old requests outside the time window
        self.requests[identifier] = [
            timestamp for timestamp in self.requests[identifier]
            if current_time - timestamp < self.window
        ]

        # Check if rate limit exceeded
        if len(self.requests[identifier]) >= self.rate_limit:
            oldest_request = self.requests[identifier][0]
            retry_after = int(self.window - (current_time - oldest_request))

            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": f"Rate limit exceeded: {self.rate_limit} requests per {self.window} seconds",
                    "retry_after": retry_after
                },
                headers={"Retry-After": str(retry_after)}
            )

        # Add current request timestamp
        self.requests[identifier].append(current_time)

        # Process request
        response = await call_next(request)
        return response
