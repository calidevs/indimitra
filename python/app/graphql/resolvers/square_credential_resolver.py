import strawberry
from typing import List, Optional
from strawberry.types import Info
from app.db.session import get_db
from app.db.models.store import StoreModel
from app.services.square_oauth_service import (
    initiate_square_oauth,
    revoke_square_tokens
)
from app.services.token_refresh_service import refresh_square_token
from app.graphql.permissions.store_permissions import (
    IsAdmin,
    IsStoreOwnerOrAdmin
)
from sqlalchemy.orm import Session
import os
import logging

logger = logging.getLogger(__name__)


@strawberry.type
class SquareConnectionStatus:
    """Store's Square payment connection status"""
    store_id: int
    store_name: str
    is_connected: bool
    merchant_id: Optional[str] = None  # Masked merchant ID


@strawberry.type
class StorePaymentConfig:
    """Public store payment configuration for checkout"""
    store_id: int
    is_square_connected: bool
    cod_enabled: bool
    square_application_id: Optional[str] = None
    square_location_id: Optional[str] = None  # Needed by PaymentForm SDK as locationId


@strawberry.type
class ConnectSquareResult:
    """Result of initiating Square OAuth connection"""
    authorization_url: str
    message: str


@strawberry.type
class DisconnectSquareResult:
    """Result of disconnecting Square credentials"""
    success: bool
    message: str


@strawberry.type
class RefreshTokenResult:
    """Result of forcing a token refresh"""
    success: bool
    message: str


def _mask_merchant_id(merchant_id: Optional[str]) -> Optional[str]:
    """Mask merchant ID for security (show only last 4 chars)"""
    if not merchant_id:
        return None
    if len(merchant_id) <= 4:
        return merchant_id
    return f"sq-***{merchant_id[-4:]}"


@strawberry.type
class SquareCredentialQuery:
    @strawberry.field(permission_classes=[IsStoreOwnerOrAdmin])
    def store_square_status(self, store_id: int, info: Info) -> Optional[SquareConnectionStatus]:
        """Get Square connection status for a specific store"""
        db: Session = next(get_db())
        try:
            store = db.query(StoreModel).filter(StoreModel.id == store_id).first()

            if not store:
                logger.warning(f"Store {store_id} not found")
                return None

            return SquareConnectionStatus(
                store_id=store.id,
                store_name=store.name,
                is_connected=store.is_square_connected or False,
                merchant_id=_mask_merchant_id(store.square_merchant_id) if store.is_square_connected else None
            )
        finally:
            db.close()

    @strawberry.field(permission_classes=[IsAdmin])
    def all_stores_square_status(self, info: Info) -> List[SquareConnectionStatus]:
        """Get Square connection status for all stores (admin only)"""
        db: Session = next(get_db())
        try:
            stores = db.query(StoreModel).all()

            return [
                SquareConnectionStatus(
                    store_id=store.id,
                    store_name=store.name,
                    is_connected=store.is_square_connected or False,
                    merchant_id=_mask_merchant_id(store.square_merchant_id) if store.is_square_connected else None
                )
                for store in stores
            ]
        finally:
            db.close()

    @strawberry.field
    def store_payment_config(self, store_id: int) -> Optional[StorePaymentConfig]:
        """
        Get payment configuration for a store (public query for checkout).

        Returns available payment methods and public identifiers needed by
        frontend payment SDKs. Does NOT expose secret credentials.
        """
        db: Session = next(get_db())
        try:
            store = db.query(StoreModel).filter(StoreModel.id == store_id).first()

            if not store:
                logger.warning(f"Store {store_id} not found")
                return None

            return StorePaymentConfig(
                store_id=store.id,
                is_square_connected=store.is_square_connected or False,
                cod_enabled=store.cod_enabled or False,
                square_application_id=os.getenv('SQUARE_APPLICATION_ID') if store.is_square_connected else None,
                square_location_id=store.square_merchant_id if store.is_square_connected else None  # Public location ID for SDK
            )
        finally:
            db.close()


@strawberry.type
class SquareCredentialMutation:
    @strawberry.mutation(permission_classes=[IsStoreOwnerOrAdmin])
    def connect_square(self, store_id: int, info: Info) -> ConnectSquareResult:
        """
        Generate Square OAuth authorization URL for a store.

        Returns URL that frontend should redirect to for OAuth flow.
        """
        try:
            # Get redirect URI from environment or use default
            redirect_uri = os.getenv('OAUTH_REDIRECT_URI', 'http://localhost:8000/oauth/callback')

            # Generate OAuth URL
            auth_url = initiate_square_oauth(store_id, redirect_uri)

            return ConnectSquareResult(
                authorization_url=auth_url,
                message=f"Redirect user to authorization URL to connect Square"
            )
        except ValueError as e:
            logger.error(f"Failed to generate OAuth URL for store {store_id}: {e}")
            return ConnectSquareResult(
                authorization_url="",
                message=f"Error: {str(e)}"
            )
        except Exception as e:
            logger.error(f"Unexpected error generating OAuth URL for store {store_id}: {e}")
            return ConnectSquareResult(
                authorization_url="",
                message="An unexpected error occurred"
            )

    @strawberry.mutation(permission_classes=[IsStoreOwnerOrAdmin])
    def disconnect_square(self, store_id: int, info: Info) -> DisconnectSquareResult:
        """
        Disconnect Square payment credentials and revoke tokens.

        This will prevent the store from accepting online payments until reconnected.
        """
        db: Session = next(get_db())
        try:
            success = revoke_square_tokens(store_id, db)
            return DisconnectSquareResult(
                success=success,
                message="Square credentials disconnected successfully"
            )
        except ValueError as e:
            logger.error(f"Failed to disconnect Square for store {store_id}: {e}")
            return DisconnectSquareResult(
                success=False,
                message=str(e)
            )
        except Exception as e:
            logger.error(f"Unexpected error disconnecting Square for store {store_id}: {e}")
            return DisconnectSquareResult(
                success=False,
                message="An unexpected error occurred"
            )
        finally:
            db.close()

    @strawberry.mutation(permission_classes=[IsAdmin])
    def force_refresh_token(self, store_id: int, info: Info) -> RefreshTokenResult:
        """
        Manually trigger token refresh for a store (admin only).

        Useful for troubleshooting or immediate refresh needs.
        """
        try:
            success = refresh_square_token(store_id)
            if success:
                return RefreshTokenResult(
                    success=True,
                    message=f"Successfully refreshed token for store {store_id}"
                )
            else:
                return RefreshTokenResult(
                    success=False,
                    message=f"Failed to refresh token for store {store_id}. Check logs for details."
                )
        except Exception as e:
            logger.error(f"Unexpected error forcing token refresh for store {store_id}: {e}")
            return RefreshTokenResult(
                success=False,
                message="An unexpected error occurred"
            )
