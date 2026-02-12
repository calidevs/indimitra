"""SQLAlchemy TypeDecorator for transparent column encryption"""

from sqlalchemy.types import TypeDecorator, Text
from cryptography.fernet import Fernet
from app.services.encryption_service import get_encryption_key


class EncryptedType(TypeDecorator):
    """
    A SQLAlchemy TypeDecorator that transparently encrypts data on write
    and decrypts on read using Fernet symmetric encryption.

    Usage:
        class MyModel(Base):
            __tablename__ = 'my_table'

            id = Column(Integer, primary_key=True)
            secret_token = Column(EncryptedType('my-secret-name'))

    The encryption key is retrieved from AWS Secrets Manager (or ENCRYPTION_KEY env var
    for local development). The Fernet instance is lazily initialized on first use.
    """

    impl = Text
    cache_ok = True

    def __init__(self, secret_name: str, *args, **kwargs):
        """
        Initialize the EncryptedType.

        Args:
            secret_name: The name of the secret in AWS Secrets Manager
                        (or use ENCRYPTION_KEY env var for local dev)
        """
        super().__init__(*args, **kwargs)
        self.secret_name = secret_name
        # DO NOT initialize Fernet here - it must be lazy to avoid loading
        # encryption keys at import time (before the app starts)

    def _get_fernet(self) -> Fernet:
        """
        Lazily initialize and cache the Fernet instance.

        Returns:
            A Fernet instance for encryption/decryption
        """
        if not hasattr(self, '_fernet'):
            key = get_encryption_key(self.secret_name)
            self._fernet = Fernet(key)
        return self._fernet

    def process_bind_param(self, value, dialect):
        """
        Encrypt the value before storing it in the database.

        Args:
            value: The plaintext value to encrypt (or None)
            dialect: The SQLAlchemy dialect (unused)

        Returns:
            The encrypted value as a UTF-8 string, or None if input is None
        """
        if value is None:
            return None

        # Convert to string if not already
        if not isinstance(value, str):
            value = str(value)

        # Encrypt: encode to bytes -> encrypt -> decode to string for storage
        fernet = self._get_fernet()
        encrypted_bytes = fernet.encrypt(value.encode('utf-8'))
        return encrypted_bytes.decode('utf-8')

    def process_result_value(self, value, dialect):
        """
        Decrypt the value after reading it from the database.

        Args:
            value: The encrypted value from the database (or None)
            dialect: The SQLAlchemy dialect (unused)

        Returns:
            The decrypted plaintext value, or None if input is None
        """
        if value is None:
            return None

        # Decrypt: encode to bytes -> decrypt -> decode to string
        fernet = self._get_fernet()
        decrypted_bytes = fernet.decrypt(value.encode('utf-8'))
        return decrypted_bytes.decode('utf-8')
