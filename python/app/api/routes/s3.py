from fastapi import APIRouter, HTTPException
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
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Configure S3 client with explicit credentials
s3 = boto3.client(
    "s3",
    region_name=os.getenv("AWS_REGION"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
)

# Get bucket name from environment variable
BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "indimitra-dev-order-files")

def sanitize_filename(filename: str) -> str:
    """Convert string to lowercase and replace spaces with underscores."""
    # Convert to lowercase and replace spaces with underscores
    sanitized = filename.lower().replace(' ', '_')
    # Remove any characters that aren't alphanumeric or underscore
    sanitized = re.sub(r'[^a-z0-9_]', '', sanitized)
    return sanitized

def generate_product_key(product_name: str, category_name: str, original_filename: str) -> str:
    """Generate a unique S3 key for product images."""
    # Get the file extension
    _, ext = os.path.splitext(original_filename)
    if not ext:
        ext = '.jpg'  # Default to jpg if no extension found
    
    # Sanitize product and category names
    sanitized_product = sanitize_filename(product_name)
    sanitized_category = sanitize_filename(category_name)
    
    # Create key: products/{category_name}_{product_name}.{ext}
    key = f"products/{sanitized_category}_{sanitized_product}{ext}"
    logger.info(f"Generated product key: {key} from product: {product_name}, category: {category_name}")
    return key

def generate_filename(original_filename: str, order_id: int) -> str:
    """Generate a filename that includes order ID and preserves extension."""
    # Get the file extension
    _, ext = os.path.splitext(original_filename)
    if not ext:
        ext = '.bin'  # Default extension if none found
    
    # Create filename: order_{order_id}{ext}
    new_filename = f"order_{order_id}{ext}"
    logger.info(f"Generated filename: {new_filename} from original: {original_filename}")
    return new_filename

@router.get("/s3/generate-upload-url")
def generate_upload_url(file_name: str, order_id: int):
    try:
        # URL decode the filename to handle special characters
        file_name = urllib.parse.unquote(file_name)
        logger.info(f"Received filename: {file_name} for order: {order_id}")
        
        # Generate filename with order ID
        new_filename = generate_filename(file_name, order_id)
        
        # Get the content type based on file extension
        content_type, _ = mimetypes.guess_type(file_name)
        if not content_type:
            content_type = 'application/octet-stream'  # Default to binary if type not recognized
            
        # Use consistent path structure with new filename
        key = f"orders/{order_id}/{new_filename}"
        
        logger.info(f"Generating upload URL for bucket: {BUCKET_NAME}, key: {key}, content_type: {content_type}")
        
        url = s3.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": BUCKET_NAME,
                "Key": key,
                "ContentType": content_type,
                "ContentDisposition": f'inline; filename="{new_filename}"'
            },
            ExpiresIn=300,  # URL expires in 5 minutes
        )
        return {
            "upload_url": url,
            "content_type": content_type,  # Return the content type to ensure consistency
            "file_name": new_filename,  # Return the new filename
            "key": key  # Return the S3 key for storing in the database
        }
    except Exception as e:
        logger.error(f"Error generating upload URL: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/s3/generate-view-url")
def generate_view_url(
    order_id: Optional[int] = None, 
    file_name: Optional[str] = None, 
    bill_key: Optional[str] = None,
    key: Optional[str] = None
):
    try:
        # If key is provided, use it directly (for product images)
        if key:
            s3_key = key
        # If bill_key is provided, use it directly (for order bills)
        elif bill_key:
            s3_key = bill_key
        else:
            # URL decode the filename to handle special characters
            file_name = urllib.parse.unquote(file_name)
            logger.info(f"Generating view URL for order: {order_id}, file: {file_name}")
            
            # Generate filename with order ID to match upload logic
            new_filename = generate_filename(file_name, order_id)
            s3_key = f"orders/{order_id}/{new_filename}"
        
        logger.info(f"Generating view URL for bucket: {BUCKET_NAME}, key: {s3_key}")
        
        # Check if file exists
        try:
            s3.head_object(Bucket=BUCKET_NAME, Key=s3_key)
        except Exception as e:
            logger.error(f"File not found: {str(e)}")
            raise HTTPException(status_code=404, detail="File not found")
            
        # Get content type for the file
        content_type, _ = mimetypes.guess_type(s3_key)
        if not content_type:
            content_type = 'application/octet-stream'
            
        url = s3.generate_presigned_url(
            ClientMethod="get_object",
            Params={
                "Bucket": BUCKET_NAME,
                "Key": s3_key,
                "ResponseContentType": content_type,
                "ResponseContentDisposition": f'inline; filename="{os.path.basename(s3_key)}"'
            },
            ExpiresIn=3600,  # URL expires in 1 hour
        )
        return {
            "view_url": url,
            "content_type": content_type,
            "file_name": os.path.basename(s3_key)
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error generating view URL: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/orders/{order_id}/set-bill-url")
def set_bill_url(order_id: int, file_name: str, db: Session = Depends(get_db)):
    try:
        # Generate the S3 key
        key = f"orders/{order_id}/{file_name}"
        
        # Update the order's bill_url field
        order = db.query(OrderModel).filter(OrderModel.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
            
        order.bill_url = key
        db.commit()
        
        return {"message": "Bill URL updated successfully", "bill_url": key}
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error setting bill URL: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/s3/generate-product-upload-url")
def generate_product_upload_url(product_name: str, category_name: str, file_name: str):
    try:
        # URL decode the filename to handle special characters
        file_name = urllib.parse.unquote(file_name)
        logger.info(f"Received product upload request - product: {product_name}, category: {category_name}, file: {file_name}")
        
        # Generate unique key for the product image
        key = generate_product_key(product_name, category_name, file_name)
        
        # Get the content type based on file extension
        content_type, _ = mimetypes.guess_type(file_name)
        if not content_type:
            content_type = 'image/jpeg'  # Default to jpeg if type not recognized
            
        logger.info(f"Generating product upload URL for bucket: {BUCKET_NAME}, key: {key}, content_type: {content_type}")
        
        url = s3.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": BUCKET_NAME,
                "Key": key,
                "ContentType": content_type,
                "ContentDisposition": f'inline; filename="{os.path.basename(key)}"'
            },
            ExpiresIn=300,  # URL expires in 5 minutes
        )
        return {
            "upload_url": url,
            "content_type": content_type,
            "key": key
        }
    except Exception as e:
        logger.error(f"Error generating product upload URL: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 