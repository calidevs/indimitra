"""
Root conftest.py - Test fixtures and configuration

This module provides shared fixtures for all tests.
"""

import os
import pytest
from datetime import datetime, timedelta
from typing import Generator, Dict, Any
from unittest.mock import Mock, patch
import jwt
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

# Set test environment variables before importing app
os.environ["COGNITO_USER_POOL_ID"] = "us-east-1_TEST123456"
os.environ["COGNITO_USER_POOL_CLIENT_ID"] = "test_client_id_123456"
os.environ["AWS_REGION"] = "us-east-1"
os.environ["POSTGRES_USER"] = "test"
os.environ["POSTGRES_PASSWORD"] = "test"
os.environ["POSTGRES_HOST"] = "localhost"
os.environ["POSTGRES_PORT"] = "5432"
os.environ["POSTGRES_DB"] = "test_db"
os.environ["ALLOWED_ORIGINS"] = "http://localhost:3000"
os.environ["ENABLE_GRAPHIQL"] = "false"
os.environ["AWS_ACCESS_KEY_ID"] = "test_key"
os.environ["AWS_SECRET_ACCESS_KEY"] = "test_secret"
os.environ["S3_BUCKET_NAME"] = "test_bucket"
os.environ["SQUARE_APPLICATION_ID"] = "test_square_app"
os.environ["ENCRYPTION_KEY"] = "test_encryption_key_32_bytes_long"

from app.db.base import Base
from app.db.models.user import UserModel, UserType
from app.db.models.store import StoreModel
from app.db.models.order import OrderModel, OrderStatus
from app.db.models.product import ProductModel
from app.db.models.inventory import InventoryModel
from app.api.dependencies import get_db
from app.main import app


# ============================================================
# Database Fixtures
# ============================================================

@pytest.fixture(scope="session")
def test_db_engine():
    """Create an in-memory SQLite database engine for testing"""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(test_db_engine) -> Generator[Session, None, None]:
    """Create a new database session for each test"""
    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=test_db_engine
    )
    session = TestingSessionLocal()

    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture(scope="function")
def client(db_session) -> Generator[TestClient, None, None]:
    """Create a test client with database session override"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


# ============================================================
# Authentication Fixtures
# ============================================================

@pytest.fixture
def mock_cognito_user():
    """Mock CognitoUser object"""
    from app.middleware.auth_middleware import CognitoUser
    return CognitoUser(
        cognito_id="test_cognito_123",
        email="test@example.com",
        sub="test_cognito_123",
        token_claims={
            "sub": "test_cognito_123",
            "email": "test@example.com",
            "cognito:username": "testuser"
        }
    )


@pytest.fixture
def valid_jwt_token():
    """Generate a valid JWT token for testing"""
    payload = {
        "sub": "test_cognito_123",
        "email": "test@example.com",
        "cognito:username": "testuser",
        "exp": datetime.utcnow() + timedelta(hours=1),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, "test_secret", algorithm="HS256")


@pytest.fixture
def expired_jwt_token():
    """Generate an expired JWT token for testing"""
    payload = {
        "sub": "test_cognito_123",
        "email": "test@example.com",
        "exp": datetime.utcnow() - timedelta(hours=1),
        "iat": datetime.utcnow() - timedelta(hours=2)
    }
    return jwt.encode(payload, "test_secret", algorithm="HS256")


@pytest.fixture
def admin_jwt_token():
    """Generate JWT token for admin user"""
    payload = {
        "sub": "admin_cognito_456",
        "email": "admin@example.com",
        "cognito:username": "adminuser",
        "exp": datetime.utcnow() + timedelta(hours=1),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, "test_secret", algorithm="HS256")


@pytest.fixture
def store_manager_jwt_token():
    """Generate JWT token for store manager"""
    payload = {
        "sub": "manager_cognito_789",
        "email": "manager@example.com",
        "cognito:username": "manageruser",
        "exp": datetime.utcnow() + timedelta(hours=1),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, "test_secret", algorithm="HS256")


# ============================================================
# User Fixtures
# ============================================================

@pytest.fixture
def test_user(db_session) -> UserModel:
    """Create a test user"""
    user = UserModel(
        id=1,
        email="test@example.com",
        mobile="1234567890",
        active=True,
        type=UserType.USER,
        referralId="REF123",
        cognitoId="test_cognito_123",
        createdAt=datetime.utcnow(),
        updatedAt=datetime.utcnow()
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def admin_user(db_session) -> UserModel:
    """Create an admin user"""
    user = UserModel(
        id=2,
        email="admin@example.com",
        mobile="9876543210",
        active=True,
        type=UserType.ADMIN,
        referralId="ADMIN123",
        cognitoId="admin_cognito_456",
        createdAt=datetime.utcnow(),
        updatedAt=datetime.utcnow()
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def store_manager_user(db_session) -> UserModel:
    """Create a store manager user"""
    user = UserModel(
        id=3,
        email="manager@example.com",
        mobile="5555555555",
        active=True,
        type=UserType.STORE_MANAGER,
        referralId="MGR123",
        cognitoId="manager_cognito_789",
        createdAt=datetime.utcnow(),
        updatedAt=datetime.utcnow()
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


# ============================================================
# Store Fixtures
# ============================================================

@pytest.fixture
def test_store(db_session, store_manager_user) -> StoreModel:
    """Create a test store"""
    store = StoreModel(
        id=1,
        name="Test Store",
        description="Test store description",
        managerUserId=store_manager_user.id,
        is_square_connected=False,
        cod_enabled=True,
        active=True
    )
    db_session.add(store)
    db_session.commit()
    db_session.refresh(store)
    return store


@pytest.fixture
def another_store(db_session, admin_user) -> StoreModel:
    """Create another test store"""
    store = StoreModel(
        id=2,
        name="Another Store",
        description="Another store description",
        managerUserId=admin_user.id,
        is_square_connected=False,
        cod_enabled=True,
        active=True
    )
    db_session.add(store)
    db_session.commit()
    db_session.refresh(store)
    return store


# ============================================================
# Order Fixtures
# ============================================================

@pytest.fixture
def test_order(db_session, test_user, test_store) -> OrderModel:
    """Create a test order"""
    order = OrderModel(
        id=1,
        storeId=test_store.id,
        createdByUserId=test_user.id,
        status=OrderStatus.PENDING,
        totalAmount=100.0,
        orderTotalAmount=110.0,
        taxAmount=10.0,
        pickupOrDelivery="delivery",
        createdAt=datetime.utcnow(),
        updatedAt=datetime.utcnow()
    )
    db_session.add(order)
    db_session.commit()
    db_session.refresh(order)
    return order


# ============================================================
# Mock Fixtures
# ============================================================

@pytest.fixture
def mock_cognito_decode():
    """Mock cognitojwt.decode function"""
    with patch("app.middleware.auth_middleware.cognitojwt.decode") as mock:
        mock.return_value = {
            "sub": "test_cognito_123",
            "email": "test@example.com",
            "cognito:username": "testuser"
        }
        yield mock


@pytest.fixture
def mock_s3_client():
    """Mock boto3 S3 client"""
    with patch("app.api.routes.s3.s3") as mock:
        mock.generate_presigned_url.return_value = "https://s3.amazonaws.com/test-bucket/test-key?signature=xyz"
        mock.head_object.return_value = {"ContentLength": 1024}
        yield mock


@pytest.fixture
def mock_limiter():
    """Mock rate limiter"""
    with patch("app.middleware.rate_limit_middleware.limiter") as mock:
        yield mock
