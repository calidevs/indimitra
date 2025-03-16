variable "name_prefix" {
  description = "Prefix for ECR repository"
  type        = string
}

variable "image_tag_mutability" {
  description = "Image tag mutability setting"
  type        = string
  default     = "MUTABLE"
}

variable "encryption_type" {
  description = "Encryption type for ECR"
  type        = string
  default     = "KMS"
}

variable "scan_on_push" {
  description = "Whether to scan images on push"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags for ECR repository"
  type        = map(string)
  default     = {}
}
