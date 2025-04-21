resource "aws_s3_bucket" "bucket" {
  bucket = var.bucket
  tags = var.tags
}
data "aws_region" "current" {}

resource "aws_s3_bucket_versioning" "versioning" {
  bucket = aws_s3_bucket.bucket.id
  versioning_configuration {
    status = var.versioning
  }
}