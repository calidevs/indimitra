resource "aws_s3_bucket" "frontend_bucket" {
  bucket = var.bucket
  tags = var.tags
}
data "aws_region" "current" {}

resource "aws_s3_bucket_versioning" "versioning" {
  bucket = aws_s3_bucket.frontend_bucket.id
  versioning_configuration {
    status = var.versioning
  }
  
}

resource "aws_s3_object" "folder" {
  bucket = aws_s3_bucket.frontend_bucket.id
  key    = "static-files/" # The trailing "/" makes it a folder
  acl    = "private"
}