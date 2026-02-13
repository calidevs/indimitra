from functools import wraps
from fastapi import HTTPException
from typing import Callable
import logging

logger = logging.getLogger(__name__)

def require_auth(resolver: Callable):
    """
    Decorator for GraphQL resolvers that requires authentication
    
    Usage:
    @require_auth  # Just check if user is authenticated
    """
    @wraps(resolver)
    def wrapper(self, info, *args, **kwargs):
        # Get user from context
        current_user = info.context.get("current_user")
        if not current_user:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        # Call the original resolver
        return resolver(self, info, *args, **kwargs)
    return wrapper
