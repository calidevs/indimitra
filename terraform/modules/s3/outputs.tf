output "bucket" {
  value = aws_s3_bucket.bucket.bucket
}


output "versioning" {
  value = aws_s3_bucket.bucket.versioning[0].enabled
}

