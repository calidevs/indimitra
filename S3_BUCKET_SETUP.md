# S3 Bucket Configuration Guide

## Current S3 Bucket

**Bucket Name:** `indimitra-dev-order-files`

This bucket is configured in `python/app/api/routes/s3.py` and can be overridden with the `S3_BUCKET_NAME` environment variable.

## Bucket Structure

The bucket organizes files as follows:
- **Store Images:** `stores/{store_id}/{timestamp}_{filename}`
- **Product Images:** `products/{category}_{product_name}.{ext}`
- **Order Files:** `orders/{order_id}/{filename}`

## How to Access S3 Bucket in AWS Console

1. **Log into AWS Console:**
   - Go to https://console.aws.amazon.com
   - Sign in with your AWS credentials

2. **Navigate to S3:**
   - Search for "S3" in the AWS services search bar
   - Click on "S3" service

3. **Find Your Bucket:**
   - In the S3 dashboard, look for `indimitra-dev-order-files`
   - Click on the bucket name to view its contents

4. **Browse Files:**
   - Click on folders (e.g., `stores/`, `products/`, `orders/`) to navigate
   - Click on individual files to view details

## Making the Bucket Public (Read-Only)

⚠️ **Security Warning:** Making a bucket public allows anyone with the URL to access files. Only do this if you need public access to images.

### Option 1: Make Specific Objects Public (Recommended)

1. In the S3 bucket, select the file(s) you want to make public
2. Click "Actions" → "Make public using ACL"
3. Confirm the action

### Option 2: Configure Bucket Policy for Public Read

1. Go to your bucket → **Permissions** tab
2. Scroll to **Bucket policy**
3. Add this policy (replace `indimitra-dev-order-files` with your bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::indimitra-dev-order-files/*"
    }
  ]
}
```

4. Click **Save changes**

### Option 3: Block Public Access Settings

1. Go to **Permissions** tab → **Block public access (bucket settings)**
2. Click **Edit**
3. Uncheck **Block all public access** (if you want public access)
4. Save changes

⚠️ **Note:** AWS recommends keeping public access blocked for security. Only enable if necessary.

## Current Configuration

The application uses **presigned URLs** for secure access:
- **Upload URLs:** Valid for 5 minutes (300 seconds)
- **View URLs:** Valid for 1 hour (3600 seconds)

This means files are **not publicly accessible by default** - users need authenticated presigned URLs to access them.

## Viewing Files Directly

If you want to view files directly without presigned URLs:

1. **Public URL Format:**
   ```
   https://indimitra-dev-order-files.s3.amazonaws.com/{key}
   ```
   
   Example:
   ```
   https://indimitra-dev-order-files.s3.amazonaws.com/stores/1/20250111_120000_image.jpg
   ```

2. **This only works if:**
   - The bucket/object is configured for public read access
   - OR you have AWS credentials configured in your browser

## Environment Variables

Make sure these are set in your `.env` file:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=indimitra-dev-order-files
```

## Troubleshooting

### CORS Issues
If you see CORS errors, ensure:
- Your bucket CORS configuration allows your frontend origin
- Go to bucket → **Permissions** → **Cross-origin resource sharing (CORS)**

Example CORS configuration:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:3000", "https://indimitra.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### Access Denied Errors
- Check IAM permissions for your AWS credentials
- Ensure the bucket policy allows your IAM user/role to read/write
- Verify the presigned URL hasn't expired
