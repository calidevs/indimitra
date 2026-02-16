from fastapi import APIRouter, HTTPException, Depends, status, Request
import boto3
from botocore.client import Config
import os
from typing import Optional
from datetime import datetime
import logging
import mimetypes
import urllib.parse
import re
from sqlalchemy.orm import Session
from fastapi import Depends
from app.db.session import get_db
from app.db.models.order import OrderModel
from app.db.models.user import UserModel, UserType
from app.db.models.store import StoreModel
from app.middleware.auth_middleware import CognitoUser, get_current_user, get_db_user
from app.middleware.rate_limit_middleware import limiter

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(filename)s:%(lineno)d] - %(message)s",
)
logger = logging.getLogger(__name__)

# Check for required environment variables
required_env_vars = [
    "AWS_REGION",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "S3_BUCKET_NAME",
    "COGNITO_USER_POOL_ID",
    "COGNITO_USER_POOL_CLIENT_ID"
]

missing_envs = []
for key in required_env_vars:
    value = os.getenv(key)
    if not value:
        missing_envs.append(key)
        logger.warning(f"❌ Environment variable '{key}' is missing or empty.")
    else:
        logger.info(f"✅ Environment variable '{key}' is set.")

if missing_envs:
    logger.error(f"Missing environment variables: {missing_envs}")

# Extract environment variables
AWS_REGION = os.getenv("AWS_REGION")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "indimitra-dev-order-files")

# Initialize FastAPI router
router = APIRouter()

# Initialize boto3 S3 client
s3 = boto3.client(
    "s3",
    region_name=AWS_REGION,
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    config=Config(signature_version="s3v4")
)

# File type validation
ALLOWED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif', '.bmp', '.tiff', '.tif'}
ALLOWED_DOCUMENT_EXTENSIONS = {'.pdf', '.doc', '.docx'}
ALLOWED_EXTENSIONS = ALLOWED_IMAGE_EXTENSIONS | ALLOWED_DOCUMENT_EXTENSIONS

# Authorization helpers
def _can_access_order(db_user: UserModel, order: OrderModel, db: Session) -> bool:
    """Check if user can access an order"""
    if not db_user:
        return False

    # Admin: can access all orders
    if db_user.type == UserType.ADMIN:
        return True

    # User: can access own orders
    if db_user.id == order.createdByUserId:
        return True

    # Store manager: can access store's orders
    if db_user.type == UserType.STORE_MANAGER:
        store = db.query(StoreModel).filter(
            StoreModel.id == order.storeId,
            StoreModel.managerUserId == db_user.id
        ).first()
        if store:
            return True

    return False


def _can_access_store(db_user: UserModel, store_id: int, db: Session) -> bool:
    """Check if user can manage a store"""
    if not db_user:
        return False

    # Admin: can manage all stores
    if db_user.type == UserType.ADMIN:
        return True

    # Store manager: can only manage own store
    if db_user.type == UserType.STORE_MANAGER:
        store = db.query(StoreModel).filter(
            StoreModel.id == store_id,
            StoreModel.managerUserId == db_user.id
        ).first()
        return store is not None

    return False


def _validate_file_type(filename: str, allowed_extensions: set) -> None:
    """Validate file extension is allowed"""
    _, ext = os.path.splitext(filename.lower())
    if not ext or ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type {ext} not allowed. Allowed types: {', '.join(sorted(allowed_extensions))}"
        )


# Utility: sanitize filename
def sanitize_filename(filename: str) -> str:
    sanitized = filename.lower().replace(' ', '_')
    sanitized = re.sub(r'[^a-z0-9_.]', '', sanitized)  # Keep dots for extensions
    return sanitized

# Utility: generate store image key
def generate_store_key(store_id: str, original_filename: str) -> str:
    """Generate S3 key for store images"""
    sanitized = sanitize_filename(original_filename)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    # Handle 'new' as a special case for stores being created
    store_folder = store_id if store_id != 'new' else 'new'
    return f"stores/{store_folder}/{timestamp}_{sanitized}"

# Utility: generate product image key
def generate_product_key(product_name: str, category_name: str, original_filename: str) -> str:
    _, ext = os.path.splitext(original_filename)
    ext = ext if ext else '.jpg'
    key = f"products/{sanitize_filename(category_name)}_{sanitize_filename(product_name)}{ext}"
    logger.info(f"Generated product key: {key}")
    return key

# Utility: generate file name
def generate_filename(original_filename: str, order_id: int) -> str:
    _, ext = os.path.splitext(original_filename)
    ext = ext if ext else '.bin'
    new_filename = f"order_{order_id}{ext}"
    logger.info(f"Generated filename: {new_filename}")
    return new_filename

# Endpoint: Upload URL for orders
@router.get("/s3/generate-upload-url")
@limiter.limit("30/minute")  # Rate limit file uploads per user
def generate_upload_url(
    request: Request,
    file_name: str,
    order_id: int,
    current_user: CognitoUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        file_name = urllib.parse.unquote(file_name)
        logger.info(f"Request for upload URL - file: {file_name}, order_id: {order_id}, user: {current_user.email}")

        # Validate file type
        _validate_file_type(file_name, ALLOWED_EXTENSIONS)

        # Get database user
        db_user = db.query(UserModel).filter(UserModel.cognitoId == current_user.cognito_id).first()
        if not db_user:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User not found in database")

        # Get order and verify access
        order = db.query(OrderModel).filter(OrderModel.id == order_id).first()
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

        if not _can_access_order(db_user, order, db):
            logger.warning(f"User {db_user.email} denied access to order {order_id}")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have permission to upload files for this order")

        new_filename = generate_filename(file_name, order_id)
        content_type, _ = mimetypes.guess_type(file_name)
        content_type = content_type or 'application/octet-stream'
        key = f"orders/{order_id}/{new_filename}"

        url = s3.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": BUCKET_NAME,
                "Key": key,
                "ContentType": content_type,
            },
            ExpiresIn=300,
        )
        logger.info(f"✅ Generated upload URL for user {db_user.email}, order {order_id}")
        return {
            "upload_url": url,
            "content_type": content_type,
            "file_name": new_filename,
            "key": key
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to generate upload URL")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Endpoint: View URL for orders or products
@router.get("/s3/generate-view-url")
def generate_view_url(
    order_id: Optional[int] = None,
    file_name: Optional[str] = None,
    bill_key: Optional[str] = None,
    key: Optional[str] = None,
    current_user: CognitoUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        s3_key = key or bill_key
        if not s3_key:
            if not order_id or not file_name:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Either (order_id + file_name) or key/bill_key must be provided")
            file_name = urllib.parse.unquote(file_name)
            new_filename = generate_filename(file_name, order_id)
            s3_key = f"orders/{order_id}/{new_filename}"

        # Extract order_id from key if viewing order files
        if s3_key.startswith("orders/"):
            try:
                extracted_order_id = int(s3_key.split("/")[1])
                order_id = order_id or extracted_order_id
            except (IndexError, ValueError):
                pass

        # If accessing order files, verify authorization
        if order_id:
            db_user = db.query(UserModel).filter(UserModel.cognitoId == current_user.cognito_id).first()
            if not db_user:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User not found in database")

            order = db.query(OrderModel).filter(OrderModel.id == order_id).first()
            if not order:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

            if not _can_access_order(db_user, order, db):
                logger.warning(f"User {db_user.email} denied access to view files for order {order_id}")
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have permission to view files for this order")

        logger.info(f"Generating view URL for key: {s3_key}, user: {current_user.email}")
        s3.head_object(Bucket=BUCKET_NAME, Key=s3_key)

        content_type, _ = mimetypes.guess_type(s3_key)
        content_type = content_type or 'application/octet-stream'

        url = s3.generate_presigned_url(
            ClientMethod="get_object",
            Params={
                "Bucket": BUCKET_NAME,
                "Key": s3_key,
                "ResponseContentType": content_type,
                "ResponseContentDisposition": f'inline; filename="{os.path.basename(s3_key)}"'
            },
            ExpiresIn=3600,
        )
        return {
            "view_url": url,
            "content_type": content_type,
            "file_name": os.path.basename(s3_key)
        }
    except HTTPException:
        raise
    except s3.exceptions.ClientError as e:
        logger.warning(f"File not found or inaccessible: {str(e)}")
        raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        logger.exception("Failed to generate view URL")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Endpoint: Set bill URL in DB
@router.post("/orders/{order_id}/set-bill-url")
def set_bill_url(
    order_id: int,
    file_name: str,
    current_user: CognitoUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Get database user
        db_user = db.query(UserModel).filter(UserModel.cognitoId == current_user.cognito_id).first()
        if not db_user:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User not found in database")

        # Get order and verify access
        order = db.query(OrderModel).filter(OrderModel.id == order_id).first()
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

        # Only store managers and admins can set bill URLs
        if db_user.type == UserType.STORE_MANAGER:
            store = db.query(StoreModel).filter(
                StoreModel.id == order.storeId,
                StoreModel.managerUserId == db_user.id
            ).first()
            if not store:
                logger.warning(f"Store manager {db_user.email} denied access to order {order_id}")
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only set bills for your own store's orders")
        elif db_user.type != UserType.ADMIN:
            logger.warning(f"User {db_user.email} (type: {db_user.type}) denied access to set bill for order {order_id}")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only store managers and admins can set bill URLs")

        key = f"orders/{order_id}/{file_name}"
        order.bill_url = key
        db.commit()

        logger.info(f"User {db_user.email} updated bill_url for order {order_id}: {key}")
        return {"message": "Bill URL updated successfully", "bill_url": key}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to update bill URL")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Endpoint: Upload URL for product image
@router.get("/s3/generate-product-upload-url")
def generate_product_upload_url(product_name: str, category_name: str, file_name: str):
    try:
        file_name = urllib.parse.unquote(file_name)
        key = generate_product_key(product_name, category_name, file_name)

        content_type, _ = mimetypes.guess_type(file_name)
        content_type = content_type or 'image/jpeg'

        logger.info(f"Generating upload URL for product image: {key}")

        url = s3.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": BUCKET_NAME,
                "Key": key,
                "ContentType": content_type,
            },
            ExpiresIn=300,
        )
        return {
            "upload_url": url,
            "content_type": content_type,
            "key": key
        }
    except Exception as e:
        logger.exception("Failed to generate product upload URL")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Endpoint: Upload URL for store image
@router.get("/s3/generate-store-upload-url")
@limiter.limit("30/minute")  # Rate limit file uploads per user
def generate_store_upload_url(
    request: Request,
    store_id: str,
    file_name: str,
    current_user: CognitoUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        file_name = urllib.parse.unquote(file_name)

        # Validate file type - only images allowed for stores
        _validate_file_type(file_name, ALLOWED_IMAGE_EXTENSIONS)

        # Get database user
        db_user = db.query(UserModel).filter(UserModel.cognitoId == current_user.cognito_id).first()
        if not db_user:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User not found in database")

        # Verify user can manage this store (unless it's 'new' for store creation)
        if store_id != 'new':
            try:
                store_id_int = int(store_id)
                if not _can_access_store(db_user, store_id_int, db):
                    logger.warning(f"User {db_user.email} denied access to upload image for store {store_id}")
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have permission to upload images for this store")
            except ValueError:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid store_id")

        key = generate_store_key(store_id, file_name)
        content_type, _ = mimetypes.guess_type(file_name)
        content_type = content_type or 'image/jpeg'

        logger.info(f"Generating upload URL for store image: {key}, user: {db_user.email}")

        url = s3.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": BUCKET_NAME,
                "Key": key,
                "ContentType": content_type,
            },
            ExpiresIn=300,
        )
        return {
            "upload_url": url,
            "content_type": content_type,
            "key": key
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to generate store upload URL")
        raise HTTPException(status_code=500, detail="Internal Server Error")
