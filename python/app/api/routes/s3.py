from fastapi import APIRouter, HTTPException, Depends
import boto3
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
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY
)

# Utility: sanitize filename
def sanitize_filename(filename: str) -> str:
    sanitized = filename.lower().replace(' ', '_')
    sanitized = re.sub(r'[^a-z0-9_]', '', sanitized)
    return sanitized

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
def generate_upload_url(file_name: str, order_id: int):
    try:
        file_name = urllib.parse.unquote(file_name)
        logger.info(f"Request for upload URL - file: {file_name}, order_id: {order_id}")

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
                "ContentDisposition": f'inline; filename="{new_filename}"'
            },
            ExpiresIn=300,
        )
        logger.info(f"✅ url '{url}'")
        return {
            "upload_url": url,
            "content_type": content_type,
            "file_name": new_filename,
            "key": key
        }
    except Exception as e:
        logger.exception("Failed to generate upload URL")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Endpoint: View URL for orders or products
@router.get("/s3/generate-view-url")
def generate_view_url(order_id: Optional[int] = None, file_name: Optional[str] = None,
                      bill_key: Optional[str] = None, key: Optional[str] = None):
    try:
        s3_key = key or bill_key
        if not s3_key:
            file_name = urllib.parse.unquote(file_name)
            new_filename = generate_filename(file_name, order_id)
            s3_key = f"orders/{order_id}/{new_filename}"

        logger.info(f"Generating view URL for key: {s3_key}")
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
    except s3.exceptions.ClientError as e:
        logger.warning(f"File not found or inaccessible: {str(e)}")
        raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        logger.exception("Failed to generate view URL")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Endpoint: Set bill URL in DB
@router.post("/orders/{order_id}/set-bill-url")
def set_bill_url(order_id: int, file_name: str, db: Session = Depends(get_db)):
    try:
        key = f"orders/{order_id}/{file_name}"
        order = db.query(OrderModel).filter(OrderModel.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        order.bill_url = key
        db.commit()

        logger.info(f"Updated bill_url for order {order_id}: {key}")
        return {"message": "Bill URL updated successfully", "bill_url": key}
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
                "ContentDisposition": f'inline; filename="{os.path.basename(key)}"'
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
