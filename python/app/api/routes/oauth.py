import os
import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.api.dependencies import get_db
from app.services.square_oauth_service import (
    validate_oauth_state,
    exchange_authorization_code
)
from app.middleware.rate_limit_middleware import limiter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/oauth", tags=["oauth"])


@router.get("/callback")
@limiter.limit("5/minute")  # Strict rate limit to prevent OAuth abuse
async def oauth_callback(
    request: Request,
    code: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    error: Optional[str] = Query(None),
    error_description: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    OAuth callback endpoint for Square authorization.

    Square redirects here after user grants/denies permission.
    Handles authorization code exchange and redirects back to frontend.
    """
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')

    # Check for OAuth error from Square
    if error:
        error_msg = error_description or error
        logger.warning(f"OAuth error received: {error_msg}")
        return RedirectResponse(
            url=f"{frontend_url}/admin/payment-settings?oauth_error={error_msg}",
            status_code=302
        )

    # Validate required parameters
    if not code or not state:
        logger.error("OAuth callback missing required parameters")
        return RedirectResponse(
            url=f"{frontend_url}/admin/payment-settings?oauth_error=Missing authorization code or state",
            status_code=302
        )

    # Validate state parameter and get store_id
    store_id = validate_oauth_state(state)
    if not store_id:
        logger.warning(f"Invalid or expired OAuth state: {state[:10]}...")
        return RedirectResponse(
            url=f"{frontend_url}/admin/payment-settings?oauth_error=Invalid or expired authorization. Please try again.",
            status_code=302
        )

    # Exchange authorization code for tokens
    try:
        result = exchange_authorization_code(code, store_id, db)
        logger.info(f"Successfully completed OAuth for store {store_id}")

        return RedirectResponse(
            url=f"{frontend_url}/admin/payment-settings?store_id={store_id}&oauth_success=true",
            status_code=302
        )
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Failed to exchange authorization code for store {store_id}: {error_msg}")

        return RedirectResponse(
            url=f"{frontend_url}/admin/payment-settings?oauth_error={error_msg}",
            status_code=302
        )
