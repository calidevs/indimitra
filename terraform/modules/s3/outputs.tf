output "bucket" {
  value = aws_s3_bucket.frontend_bucket.bucket
}


output "versioning" {
  value = aws_s3_bucket.frontend_bucket.versioning[0].enabled
}

output "folder" {
  value = aws_s3_object.folder.key
}
