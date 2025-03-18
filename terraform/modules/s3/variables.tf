variable "bucket" {
  description = "The name of the S3 bucket"
  type        = string
  
}

variable "versioning" {
  description = "Enable versioning for the S3 bucket"
  type        = string
  default     = "Enabled"
  
}

variable "tags" {
  description = "A map of tags to assign to the s3"
  type        = map(string)
  default     = {
    Environment = "dev"
   
  }
}
