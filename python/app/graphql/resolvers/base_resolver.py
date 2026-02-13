from typing import Any, Callable
from functools import wraps
from app.utils.auth_decorator import require_auth

def public(func):
    """Decorator to mark a resolver method as public (no auth required)"""
    func.is_public = True
    return func

class BaseProtectedResolver:
    """Base class for resolvers that require authentication.
    Methods can be marked as public using the @public decorator."""
    def __init_subclass__(cls) -> None:
        super().__init_subclass__()
        
        # Apply auth decorator to all methods except those marked as public
        for name, method in cls.__dict__.items():
            if callable(method) and not name.startswith('_'):
                if not hasattr(method, 'is_public'):
                    setattr(cls, name, require_auth(method))
