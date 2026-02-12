"""
Payment service for Square Payments API integration.

Handles payment processing via Square SDK with idempotency support.
"""
from typing import Optional
import os
import logging
import time
import random

from square import Square
from square.client import SquareEnvironment

# Configure logging
logger = logging.getLogger(__name__)


class PaymentError(Exception):
    """Custom exception for payment processing failures."""
    def __init__(self, message: str, code: Optional[str] = None, status_code: Optional[int] = None):
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(self.message)


def get_square_client() -> Square:
    """
    Initialize and return Square API client.

    Reads SQUARE_ACCESS_TOKEN from environment.
    Raises PaymentError if token not configured.
    """
    token = os.getenv("SQUARE_ACCESS_TOKEN")
    if not token:
        raise PaymentError(
            message="Square API credentials not configured. Set SQUARE_ACCESS_TOKEN environment variable.",
            code="CONFIGURATION_ERROR"
        )

    # Check environment (sandbox vs production)
    environment_str = os.getenv("SQUARE_ENVIRONMENT", "sandbox")
    environment = SquareEnvironment.SANDBOX if environment_str.lower() == "sandbox" else SquareEnvironment.PRODUCTION

    return Square(
        token=token,
        environment=environment
    )


def create_square_payment(
    payment_token: str,
    amount_cents: int,
    idempotency_key: str,
    currency: str = "USD"
) -> dict:
    """
    Create a payment via Square Payments API.

    Args:
        payment_token: Payment source token from Square Web Payments SDK (cnon:...)
        amount_cents: Payment amount in cents (e.g., 1000 for $10.00)
        idempotency_key: Unique key for retry safety (typically UUID)
        currency: Currency code (default: USD)

    Returns:
        dict with:
            - payment_id: Square payment ID
            - status: Payment status (COMPLETED, APPROVED, PENDING, etc.)
            - receipt_url: URL to payment receipt (if available)

    Raises:
        PaymentError: If Square API returns error or payment is declined
    """
    client = get_square_client()

    try:
        logger.info(f"Creating Square payment: amount={amount_cents} cents, idempotency_key={idempotency_key}")

        response = client.payments.create(
            source_id=payment_token,
            idempotency_key=idempotency_key,
            amount_money={
                "amount": amount_cents,
                "currency": currency
            },
            autocomplete=True  # Capture payment immediately
        )

        # Check for errors in response
        if response.errors:
            error = response.errors[0]
            error_code = error.code if hasattr(error, 'code') else "UNKNOWN"
            error_detail = error.detail if hasattr(error, 'detail') else "Payment processing failed"

            logger.error(f"Square API error: {error_code} - {error_detail}")

            # Map common error codes to user-friendly messages
            user_message = _map_square_error_to_message(error_code, error_detail)

            raise PaymentError(
                message=user_message,
                code=error_code,
                status_code=400
            )

        payment = response.payment

        # Verify payment completed successfully
        if payment.status not in ["COMPLETED", "APPROVED"]:
            logger.warning(f"Payment not completed: status={payment.status}")
            raise PaymentError(
                message=f"Payment not completed. Status: {payment.status}",
                code="PAYMENT_NOT_COMPLETED",
                status_code=400
            )

        logger.info(f"Payment successful: id={payment.id}, status={payment.status}")

        return {
            "payment_id": payment.id,
            "status": payment.status,
            "receipt_url": payment.receipt_url if payment.receipt_url else None
        }

    except PaymentError:
        # Re-raise PaymentError as-is
        raise
    except Exception as e:
        # Catch any unexpected errors
        logger.error(f"Unexpected error in payment processing: {str(e)}")
        raise PaymentError(
            message="An unexpected error occurred while processing your payment. Please try again.",
            code="UNEXPECTED_ERROR"
        )


def _map_square_error_to_message(error_code: str, detail: str) -> str:
    """Map Square error codes to user-friendly messages."""
    error_messages = {
        "CARD_DECLINED": "Your card was declined. Please try a different payment method.",
        "CARD_DECLINED_CALL_ISSUER": "Your card was declined. Please contact your bank.",
        "CARD_DECLINED_VERIFICATION_REQUIRED": "Additional verification required. Please try again.",
        "CVV_FAILURE": "Invalid security code (CVV). Please check and try again.",
        "INVALID_EXPIRATION": "Invalid card expiration date. Please check and try again.",
        "INSUFFICIENT_FUNDS": "Insufficient funds. Please try a different payment method.",
        "INVALID_CARD": "Invalid card number. Please check and try again.",
        "CARD_EXPIRED": "Your card has expired. Please use a different card.",
        "GENERIC_DECLINE": "Payment declined. Please try a different payment method.",
    }

    return error_messages.get(error_code, detail)


def create_square_payment_for_store(
    store_id: int,
    payment_token: str,
    amount_cents: int,
    idempotency_key: str,
    currency: str = "USD"
) -> dict:
    """
    Create a payment via Square Payments API using store-specific credentials.

    Args:
        store_id: Store ID whose Square credentials to use
        payment_token: Payment source token from Square Web Payments SDK (cnon:...)
        amount_cents: Payment amount in cents (e.g., 1000 for $10.00)
        idempotency_key: Unique key for retry safety (typically UUID)
        currency: Currency code (default: USD)

    Returns:
        dict with:
            - payment_id: Square payment ID
            - status: Payment status (COMPLETED, APPROVED, PENDING, etc.)
            - receipt_url: URL to payment receipt (if available)

    Raises:
        PaymentError: If Square API returns error or payment is declined
    """
    from app.db.session import SessionLocal
    from app.db.models.store import StoreModel

    db = SessionLocal()
    try:
        # Fetch store from database
        store = db.query(StoreModel).filter(StoreModel.id == store_id).first()

        if not store:
            raise PaymentError(
                message=f"Store with ID {store_id} not found",
                code="STORE_NOT_FOUND"
            )

        # Verify store has Square credentials
        if not store.is_square_connected or not store.square_access_token:
            raise PaymentError(
                message="Store payment system not configured. Please contact the store.",
                code="SQUARE_NOT_CONNECTED"
            )

        if not store.square_merchant_id:
            raise PaymentError(
                message="Store location not configured. Please contact the store.",
                code="LOCATION_ID_MISSING"
            )

        # Get Square environment
        environment_str = os.getenv("SQUARE_ENVIRONMENT", "sandbox")
        environment = SquareEnvironment.SANDBOX if environment_str.lower() == "sandbox" else SquareEnvironment.PRODUCTION

        # Initialize Square client with store's access token
        client = Square(
            token=store.square_access_token,  # Already decrypted by EncryptedType
            environment=environment
        )

        # Retry logic with exponential backoff
        max_retries = 3
        for attempt in range(max_retries):
            try:
                logger.info(
                    f"Creating Square payment for store {store_id}: "
                    f"amount={amount_cents} cents, idempotency_key={idempotency_key}, "
                    f"attempt={attempt + 1}/{max_retries}"
                )

                response = client.payments.create(
                    source_id=payment_token,
                    idempotency_key=idempotency_key,
                    amount_money={
                        "amount": amount_cents,
                        "currency": currency
                    },
                    location_id=store.square_merchant_id,  # Store's Square location
                    autocomplete=True  # Capture payment immediately
                )

                # Check for errors in response
                if response.errors:
                    error = response.errors[0]
                    error_code = error.code if hasattr(error, 'code') else "UNKNOWN"
                    error_detail = error.detail if hasattr(error, 'detail') else "Payment processing failed"

                    logger.error(f"Square API error: {error_code} - {error_detail}")

                    # Map common error codes to user-friendly messages
                    user_message = _map_square_error_to_message(error_code, error_detail)

                    raise PaymentError(
                        message=user_message,
                        code=error_code,
                        status_code=400
                    )

                payment = response.payment

                # Verify payment completed successfully
                if payment.status not in ["COMPLETED", "APPROVED"]:
                    logger.warning(f"Payment not completed: status={payment.status}")
                    raise PaymentError(
                        message=f"Payment not completed. Status: {payment.status}",
                        code="PAYMENT_NOT_COMPLETED",
                        status_code=400
                    )

                logger.info(f"Payment successful: id={payment.id}, status={payment.status}")

                return {
                    "payment_id": payment.id,
                    "status": payment.status,
                    "receipt_url": payment.receipt_url if payment.receipt_url else None
                }

            except PaymentError:
                # Re-raise PaymentError as-is (no retry for business logic errors)
                raise

            except Exception as e:
                # Check if this is a retryable error
                error_str = str(e).lower()
                is_timeout = "timeout" in error_str or "timed out" in error_str
                is_rate_limit = "429" in error_str or "rate limit" in error_str
                is_server_error = "500" in error_str or "502" in error_str or "503" in error_str or "504" in error_str

                is_retryable = is_timeout or is_rate_limit or is_server_error

                # If last attempt or not retryable, fail
                if attempt == max_retries - 1 or not is_retryable:
                    logger.error(f"Payment processing failed (non-retryable or max retries): {str(e)}")
                    raise PaymentError(
                        message="An error occurred while processing your payment. Please try again.",
                        code="UNEXPECTED_ERROR"
                    )

                # Calculate backoff with jitter
                backoff = (2 ** attempt) + random.uniform(0, 1)
                logger.warning(
                    f"Retryable error on attempt {attempt + 1}/{max_retries}: {str(e)}. "
                    f"Retrying in {backoff:.2f}s with same idempotency key..."
                )
                time.sleep(backoff)

    except PaymentError:
        # Re-raise PaymentError as-is
        raise
    except Exception as e:
        # Catch any unexpected errors
        logger.error(f"Unexpected error in payment processing: {str(e)}")
        raise PaymentError(
            message="An unexpected error occurred while processing your payment. Please try again.",
            code="UNEXPECTED_ERROR"
        )
    finally:
        db.close()
