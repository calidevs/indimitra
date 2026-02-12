import os
import logging
from functools import lru_cache
from typing import Optional
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)


class EncryptionKeyService:
    """Service for retrieving encryption keys from AWS Secrets Manager"""

    def __init__(self):
        """Initialize the service with a boto3 secretsmanager client"""
        aws_region = os.getenv('AWS_REGION')
        self.client = boto3.client('secretsmanager', region_name=aws_region)

    @lru_cache(maxsize=10)
    def get_key(self, secret_name: str) -> bytes:
        """
        Retrieve an encryption key from AWS Secrets Manager.

        Args:
            secret_name: The name/ARN of the secret in AWS Secrets Manager

        Returns:
            The secret value as bytes

        Raises:
            ValueError: If the secret doesn't exist
            RuntimeError: If decryption fails
        """
        try:
            response = self.client.get_secret_value(SecretId=secret_name)

            # Return SecretBinary if present, otherwise SecretString encoded as bytes
            if 'SecretBinary' in response:
                return response['SecretBinary']
            else:
                return response['SecretString'].encode('utf-8')

        except ClientError as e:
            error_code = e.response['Error']['Code']

            if error_code == 'ResourceNotFoundException':
                raise ValueError(f"Secret '{secret_name}' not found in AWS Secrets Manager")
            elif error_code == 'DecryptionFailure':
                raise RuntimeError(f"Failed to decrypt secret '{secret_name}'")
            else:
                # Re-raise other errors
                raise

    def clear_cache(self):
        """Clear the cached keys (useful for key rotation)"""
        self.get_key.cache_clear()


# Module-level singleton
_key_service: Optional[EncryptionKeyService] = None


def get_encryption_key(secret_name: str) -> bytes:
    """
    Get an encryption key, checking env var first (for local dev),
    then falling back to AWS Secrets Manager.

    Args:
        secret_name: The name of the secret to retrieve from AWS Secrets Manager

    Returns:
        The encryption key as bytes (Fernet-compatible base64-encoded 32 bytes)
    """
    global _key_service

    # Check for local dev environment variable first
    env_key = os.getenv('ENCRYPTION_KEY')
    if env_key:
        logger.warning(
            "Using ENCRYPTION_KEY from environment variable. "
            "This is for local development only and should NOT be used in production."
        )
        return env_key.encode('utf-8')

    # Otherwise use AWS Secrets Manager
    if _key_service is None:
        _key_service = EncryptionKeyService()

    return _key_service.get_key(secret_name)


def clear_key_cache():
    """Clear the encryption key cache (useful for key rotation)"""
    global _key_service
    if _key_service is not None:
        _key_service.clear_cache()
