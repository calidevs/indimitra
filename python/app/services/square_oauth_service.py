import os
import secrets
import logging
from typing import Optional, Dict
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from square.client import Square, SquareEnvironment
from app.db.models.store import StoreModel

logger = logging.getLogger(__name__)

# Simple in-memory cache for OAuth state tokens with TTL
# Format: {state: (store_id, timestamp)}
_oauth_state_cache: Dict[str, tuple[int, datetime]] = {}
STATE_TTL_MINUTES = 10


def _get_square_client() -> Square:
    """Initialize Square client based on environment configuration"""
    environment_name = os.getenv('SQUARE_ENVIRONMENT', 'sandbox').lower()

    if environment_name == 'production':
        environment = SquareEnvironment.PRODUCTION
    else:
        environment = SquareEnvironment.SANDBOX

    return Square(
        token=None,  # No token needed for OAuth operations
        environment=environment
    )


def initiate_square_oauth(store_id: int, redirect_uri: str) -> str:
    """
    Generate Square OAuth authorization URL for a store.

    Args:
        store_id: The store ID requesting authorization
        redirect_uri: The URL Square should redirect to after authorization

    Returns:
        Full authorization URL to redirect the user to
    """
    application_id = os.getenv('SQUARE_APPLICATION_ID')
    if not application_id:
        raise ValueError("SQUARE_APPLICATION_ID environment variable not set")

    environment_name = os.getenv('SQUARE_ENVIRONMENT', 'sandbox').lower()

    # Determine base URL based on environment
    if environment_name == 'production':
        base_url = 'https://connect.squareup.com'
    else:
        base_url = 'https://connect.squareupsandbox.com'

    # Generate cryptographically secure state parameter
    state = secrets.token_urlsafe(32)

    # Store state with timestamp for validation
    _oauth_state_cache[state] = (store_id, datetime.utcnow())

    # Clean up expired states
    _cleanup_expired_states()

    # Required scopes for payment processing
    scopes = "MERCHANT_PROFILE_READ PAYMENTS_WRITE PAYMENTS_READ"

    # URL-encode scopes using + for spaces (Square's preferred format)
    # Note: redirect_uri should NOT be URL-encoded per Square documentation
    encoded_scopes = scopes.replace(' ', '+')

    # Build authorization URL
    auth_url = (
        f"{base_url}/oauth2/authorize"
        f"?client_id={application_id}"
        f"&scope={encoded_scopes}"
        f"&state={state}"
        f"&redirect_uri={redirect_uri}"
    )

    logger.info(f"Generated OAuth URL for store {store_id}")
    return auth_url


def validate_oauth_state(state: str) -> Optional[int]:
    """
    Validate OAuth state parameter and return associated store_id.

    Args:
        state: The state parameter received from Square callback

    Returns:
        store_id if state is valid and not expired, None otherwise
    """
    if state not in _oauth_state_cache:
        logger.warning(f"OAuth state not found in cache: {state[:10]}...")
        return None

    store_id, timestamp = _oauth_state_cache[state]

    # Check if state has expired (10-minute TTL)
    age = datetime.utcnow() - timestamp
    if age > timedelta(minutes=STATE_TTL_MINUTES):
        logger.warning(f"OAuth state expired for store {store_id}")
        del _oauth_state_cache[state]
        return None

    # Remove state from cache (single-use)
    del _oauth_state_cache[state]

    logger.info(f"OAuth state validated for store {store_id}")
    return store_id


def exchange_authorization_code(code: str, store_id: int, db: Session) -> dict:
    """
    Exchange Square authorization code for access and refresh tokens.

    Args:
        code: Authorization code from Square OAuth callback
        store_id: The store ID to save credentials for
        db: Database session

    Returns:
        dict with merchant_id and success flag

    Raises:
        ValueError: If exchange fails or store not found
    """
    application_id = os.getenv('SQUARE_APPLICATION_ID')
    application_secret = os.getenv('SQUARE_APPLICATION_SECRET')
    redirect_uri = os.getenv('OAUTH_REDIRECT_URI', 'http://localhost:8000/oauth/callback')

    if not application_id or not application_secret:
        raise ValueError("Square credentials not configured")

    # Get the store
    store = db.query(StoreModel).filter(StoreModel.id == store_id).first()
    if not store:
        raise ValueError(f"Store with ID {store_id} not found")

    # Initialize Square client
    client = _get_square_client()

    # Exchange code for tokens (Square SDK v44 uses keyword arguments and returns Pydantic model)
    try:
        result = client.o_auth.obtain_token(
            client_id=application_id,
            client_secret=application_secret,
            code=code,
            grant_type='authorization_code',
            redirect_uri=redirect_uri  # Required for OAuth token exchange
        )

        # Check for errors (v44 returns Pydantic model, not wrapper)
        if result.errors:
            error_msg = f"Token exchange failed: {result.errors}"
            logger.error(f"Square OAuth error for store {store_id}: {error_msg}")
            raise ValueError(error_msg)

        # Get location_id by fetching merchant's locations using the new access token
        try:
            # Create a new client with the merchant's access token
            environment_name = os.getenv('SQUARE_ENVIRONMENT', 'sandbox').lower()
            if environment_name == 'production':
                environment = SquareEnvironment.PRODUCTION
            else:
                environment = SquareEnvironment.SANDBOX

            merchant_client = Square(
                token=result.access_token,
                environment=environment
            )

            # Fetch locations
            locations_response = merchant_client.locations.list()

            if locations_response.errors:
                logger.warning(f"Failed to fetch locations for store {store_id}: {locations_response.errors}")
                # Fall back to using merchant_id as location_id
                location_id = result.merchant_id
            elif locations_response.locations and len(locations_response.locations) > 0:
                # Use the first location's ID
                location_id = locations_response.locations[0].id
                logger.info(f"Got location_id {location_id} for store {store_id}")
            else:
                # No locations found, use merchant_id as fallback
                logger.warning(f"No locations found for store {store_id}, using merchant_id as location_id")
                location_id = result.merchant_id

        except Exception as e:
            logger.error(f"Error fetching locations for store {store_id}: {e}")
            # Fall back to merchant_id
            location_id = result.merchant_id

        # Save encrypted tokens and location to database
        store.square_access_token = result.access_token
        store.square_refresh_token = result.refresh_token
        store.square_merchant_id = location_id  # Store location_id in merchant_id field for payment processing
        store.is_square_connected = True

        db.commit()

        logger.info(f"Successfully connected Square for store {store_id} with location {location_id}")

        return {
            'merchant_id': location_id,
            'success': True
        }

    except Exception as e:
        db.rollback()
        logger.error(f"Failed to exchange authorization code for store {store_id}: {e}")
        raise ValueError(f"Failed to connect Square: {str(e)}")


def revoke_square_tokens(store_id: int, db: Session) -> bool:
    """
    Revoke Square tokens and disconnect store.

    Args:
        store_id: The store ID to disconnect
        db: Database session

    Returns:
        True if successful

    Raises:
        ValueError: If store not found or not connected
    """
    # Get the store
    store = db.query(StoreModel).filter(StoreModel.id == store_id).first()
    if not store:
        raise ValueError(f"Store with ID {store_id} not found")

    if not store.is_square_connected:
        raise ValueError(f"Store {store_id} is not connected to Square")

    application_id = os.getenv('SQUARE_APPLICATION_ID')
    if not application_id:
        raise ValueError("SQUARE_APPLICATION_ID not configured")

    # Initialize Square client
    client = _get_square_client()

    # Revoke the access token
    if store.square_access_token:
        body = {
            'client_id': application_id,
            'access_token': store.square_access_token
        }

        try:
            result = client.o_auth.revoke_token(body)

            if not result.is_success():
                logger.warning(f"Failed to revoke Square token for store {store_id}: {result.errors}")
                # Continue to clear local data even if revocation fails
        except Exception as e:
            logger.warning(f"Exception revoking Square token for store {store_id}: {e}")
            # Continue to clear local data

    # Clear all Square credentials from database
    store.square_access_token = None
    store.square_refresh_token = None
    store.square_merchant_id = None
    store.square_location_id = None
    store.is_square_connected = False

    db.commit()

    logger.info(f"Disconnected Square for store {store_id}")
    return True


def _cleanup_expired_states():
    """Remove expired state tokens from cache"""
    current_time = datetime.utcnow()
    expired_states = [
        state for state, (_, timestamp) in _oauth_state_cache.items()
        if current_time - timestamp > timedelta(minutes=STATE_TTL_MINUTES)
    ]

    for state in expired_states:
        del _oauth_state_cache[state]

    if expired_states:
        logger.debug(f"Cleaned up {len(expired_states)} expired OAuth states")
