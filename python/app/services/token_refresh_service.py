import os
import logging
from typing import Optional, Dict
from sqlalchemy.orm import Session
from square.client import Square, SquareEnvironment
from app.db.models.store import StoreModel
from app.db.session import SessionLocal
from apscheduler.schedulers.background import BackgroundScheduler

logger = logging.getLogger(__name__)

# Background scheduler instance (initialized on startup)
_scheduler: Optional[BackgroundScheduler] = None


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


def refresh_square_token(store_id: int) -> bool:
    """
    Refresh a single store's Square access token.

    Args:
        store_id: The store ID to refresh token for

    Returns:
        True if refresh successful, False otherwise
    """
    db: Session = SessionLocal()
    try:
        # Get store with valid refresh token
        store = db.query(StoreModel).filter(
            StoreModel.id == store_id,
            StoreModel.is_square_connected == True
        ).first()

        if not store:
            logger.warning(f"Store {store_id} not found or not connected to Square")
            return False

        if not store.square_refresh_token:
            logger.warning(f"Store {store_id} has no refresh token")
            return False

        # Get Square credentials
        application_id = os.getenv('SQUARE_APPLICATION_ID')
        application_secret = os.getenv('SQUARE_APPLICATION_SECRET')

        if not application_id or not application_secret:
            logger.error("Square credentials not configured (SQUARE_APPLICATION_ID or SQUARE_APPLICATION_SECRET missing)")
            return False

        # Initialize Square client
        client = _get_square_client()

        # Request token refresh (Square SDK v44 uses keyword arguments)
        try:
            result = client.o_auth.obtain_token(
                client_id=application_id,
                client_secret=application_secret,
                grant_type='refresh_token',
                refresh_token=store.square_refresh_token  # Auto-decrypted by EncryptedType
            )

            # Check for errors (v44 returns Pydantic model, not wrapper)
            if result.errors:
                # Token refresh failed - likely revoked or expired
                error_msg = f"Token refresh failed: {result.errors}"
                logger.error(f"Square token refresh error for store {store_id}: {error_msg}")

                # Mark store as disconnected (token likely revoked)
                store.is_square_connected = False
                db.commit()

                logger.warning(f"Marked store {store_id} as disconnected due to token refresh failure")
                return False

            # Update tokens (if new refresh token returned, use it)
            store.square_access_token = result.access_token
            if result.refresh_token:
                store.square_refresh_token = result.refresh_token

            db.commit()

            logger.info(f"Successfully refreshed Square token for store {store_id} ({store.name})")
            return True

        except Exception as e:
            logger.error(f"Exception during token refresh for store {store_id}: {e}")
            # Mark store as disconnected on exception
            store.is_square_connected = False
            db.commit()
            return False

    except Exception as e:
        logger.error(f"Failed to refresh token for store {store_id}: {e}")
        db.rollback()
        return False
    finally:
        db.close()


def refresh_all_square_tokens() -> Dict[str, int]:
    """
    Refresh Square access tokens for all connected stores.

    Returns:
        Dict with counts: {"refreshed": N, "failed": M, "total": T}
    """
    db: Session = SessionLocal()
    try:
        # Get all connected stores
        stores = db.query(StoreModel).filter(StoreModel.is_square_connected == True).all()

        refreshed = 0
        failed = 0
        total = len(stores)

        logger.info(f"Starting token refresh for {total} connected stores")

        for store in stores:
            try:
                # Refresh token for each store independently
                if refresh_square_token(store.id):
                    refreshed += 1
                else:
                    failed += 1
            except Exception as e:
                logger.error(f"Exception refreshing token for store {store.id}: {e}")
                failed += 1

        result = {
            "refreshed": refreshed,
            "failed": failed,
            "total": total
        }

        logger.info(f"Token refresh complete: {refreshed} refreshed, {failed} failed, {total} total")
        return result

    finally:
        db.close()


def setup_token_refresh_scheduler():
    """
    Configure and start the APScheduler background scheduler for token refresh.

    Runs refresh_all_square_tokens every 7 days (Square best practice).
    """
    global _scheduler

    if _scheduler is not None:
        logger.warning("Token refresh scheduler already running")
        return

    # Create background scheduler
    _scheduler = BackgroundScheduler(
        job_defaults={
            'coalesce': True,  # Combine multiple missed runs into one
            'max_instances': 1  # Only one instance of job can run at a time
        }
    )

    # Add job: refresh tokens every 7 days
    _scheduler.add_job(
        refresh_all_square_tokens,
        trigger='interval',
        days=7,
        id='refresh_square_tokens',
        replace_existing=True,
        coalesce=True,
        max_instances=1
    )

    # Start scheduler
    _scheduler.start()

    logger.info("Token refresh scheduler started (7-day interval)")
