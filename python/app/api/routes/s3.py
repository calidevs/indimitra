from fastapi import APIRouter, HTTPException
import boto3
import os
from typing import Optional
from datetime import datetime
import logging
import mimetypes
import urllib.parse
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
        bucket = os.getenv("S3_BUCKET_NAME")
        
        logger.info(f"Generating upload URL for bucket: {bucket}, key: {key}, content_type: {content_type}")
        
        url = s3.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": bucket,
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
def generate_view_url(order_id: Optional[int] = None, file_name: Optional[str] = None, bill_key: Optional[str] = None):
    try:
        bucket = os.getenv("S3_BUCKET_NAME")
        
        # If bill_key is provided, use it directly
        if bill_key:
            key = bill_key
        else:
            # URL decode the filename to handle special characters
            file_name = urllib.parse.unquote(file_name)
            logger.info(f"Generating view URL for order: {order_id}, file: {file_name}")
            
            # Generate filename with order ID to match upload logic
            new_filename = generate_filename(file_name, order_id)
            key = f"orders/{order_id}/{new_filename}"
        
        logger.info(f"Generating view URL for bucket: {bucket}, key: {key}")
        
        # Check if file exists
        try:
            s3.head_object(Bucket=bucket, Key=key)
        except Exception as e:
            logger.error(f"File not found: {str(e)}")
            raise HTTPException(status_code=404, detail="File not found")
            
        # Get content type for the file
        content_type, _ = mimetypes.guess_type(key)
        if not content_type:
            content_type = 'application/octet-stream'
            
        url = s3.generate_presigned_url(
            ClientMethod="get_object",
            Params={
                "Bucket": bucket,
                "Key": key,
                "ResponseContentType": content_type,
                "ResponseContentDisposition": f'inline; filename="{os.path.basename(key)}"'
            },
            ExpiresIn=3600,  # URL expires in 1 hour
        )
        return {
            "view_url": url,
            "content_type": content_type,
            "file_name": os.path.basename(key)
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