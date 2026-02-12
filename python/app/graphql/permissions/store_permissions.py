from strawberry.permission import BasePermission
from strawberry.types import Info
from typing import Any
from app.db.models.user import UserModel, UserType
from app.db.models.store import StoreModel
from app.db.session import SessionLocal
import logging

logger = logging.getLogger(__name__)


class IsAuthenticated(BasePermission):
    """Base permission: User must be authenticated"""
    message = "Authentication required"

    def has_permission(self, source: Any, info: Info, **kwargs) -> bool:
        request = info.context.get("request")
        if not request:
            return False
        return hasattr(request.state, 'user') and request.state.user is not None


class IsAdmin(BasePermission):
    """Platform admin only"""
    message = "Only platform administrators can perform this action"

    def has_permission(self, source: Any, info: Info, **kwargs) -> bool:
        request = info.context.get("request")
        if not request or not hasattr(request.state, 'user'):
            logger.warning("IsAdmin: No authenticated user found in request")
            return False

        cognito_user = request.state.user
        db = SessionLocal()
        try:
            # Query database for user by Cognito ID
            db_user = db.query(UserModel).filter(
                UserModel.cognitoId == cognito_user.cognito_id
            ).first()

            if not db_user:
                logger.warning(f"IsAdmin: User with Cognito ID {cognito_user.cognito_id} not found in database")
                return False

            # Check if user is admin
            is_admin = db_user.type == UserType.ADMIN
            if not is_admin:
                logger.warning(f"IsAdmin: User {db_user.email} (type: {db_user.type}) is not an admin")

            return is_admin

        finally:
            db.close()


class IsStoreOwnerOrAdmin(BasePermission):
    """Store manager can only access their own store, admin can access any"""
    message = "You can only manage your own store's payment settings"

    def has_permission(self, source: Any, info: Info, **kwargs) -> bool:
        request = info.context.get("request")
        if not request or not hasattr(request.state, 'user'):
            logger.warning("IsStoreOwnerOrAdmin: No authenticated user found in request")
            return False

        cognito_user = request.state.user
        store_id = kwargs.get("store_id")

        if not store_id:
            logger.warning("IsStoreOwnerOrAdmin: No store_id provided in kwargs")
            return False

        db = SessionLocal()
        try:
            # Query database for user by Cognito ID
            db_user = db.query(UserModel).filter(
                UserModel.cognitoId == cognito_user.cognito_id
            ).first()

            if not db_user:
                logger.warning(f"IsStoreOwnerOrAdmin: User with Cognito ID {cognito_user.cognito_id} not found")
                return False

            # Admins can access any store
            if db_user.type == UserType.ADMIN:
                logger.info(f"IsStoreOwnerOrAdmin: Admin {db_user.email} granted access to store {store_id}")
                return True

            # Store managers can only access their own store
            if db_user.type == UserType.STORE_MANAGER:
                store = db.query(StoreModel).filter(
                    StoreModel.id == store_id,
                    StoreModel.managerUserId == db_user.id
                ).first()

                if store:
                    logger.info(f"IsStoreOwnerOrAdmin: Store manager {db_user.email} granted access to their store {store_id}")
                    return True
                else:
                    logger.warning(f"IsStoreOwnerOrAdmin: Store manager {db_user.email} denied access to store {store_id} (not their store)")
                    return False

            # Other user types cannot access store settings
            logger.warning(f"IsStoreOwnerOrAdmin: User {db_user.email} (type: {db_user.type}) denied access to store {store_id}")
            return False

        finally:
            db.close()
