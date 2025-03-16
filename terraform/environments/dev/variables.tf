variable "region" {
  description = "The CIDR block for the VPC. Default value is a valid CIDR, but not acceptable by AWS and should be overriden"
  type        = string

}

variable "name_prefix" {
  description = "Prefix for naming resources"
  type        = string
  default     = "my-app"
}

variable "tags" {
  description = "A map of tags to assign to the RDS instance"
  type        = map(string)
  default     = {
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}


############################################
# S3 variables
############################################
variable "bucket" {
  description = "The name of the S3 bucket"
  type        = string
}

############################################
# RDS variables
############################################
variable "identifier" {
  description = "The unique identifier for the RDS instance"
  type        = string
}

variable "allocated_storage" {
  description = "The allocated storage size for the RDS instance (in GB)"
  type        = number
}

variable "engine_version" {
  description = "The version of PostgreSQL to use"
  type        = string
}

variable "instance_class" {
  description = "The instance type for the RDS instance"
  type        = string
}

variable "db_name" {
  description = "The db name for the RDS instance"
  type        = string
}

variable "username" {
  description = "The master username for the RDS instance"
  type        = string
}

variable "password" {
  description = "The master password for the RDS instance"
  type        = string
  sensitive   = true
}

variable "engine" {
  description = "The master password for the RDS instance"
  type        = string
  sensitive   = true
}

variable "storage_encrypted" {
  description = "The master password for the RDS instance"
  type        = bool
  default     = true
}

variable "skip_final_snapshot" {
  description = "The master password for the RDS instance"
  type        = bool
  default     = true 
}


variable "s3_tags" {
  description = "A map of tags to assign to the s3"
  type        = map(string)
  default     = {
    Environment = "dev"
    Name =""
  }
}

variable "vpc_security_group_ids" {
  description = "List of security groups for the RDS instance"
  type        = list(string)
  default = []
}

variable "POSTGRES_HOST" {
  description = "The host of the RDS instance"
  type        = string
}

############################################
# ECS variables
############################################
variable "ecr_app" {
  description = "ECR repository URL for the custom image"
  type        = string
}
variable "ecr_ngnix" {
  description = "ECR repository URL for the custom image"
  type        = string
}
# variable "region" {
#   description = "AWS region"
#   type        = string
#   default     = "us-east-1"
# }

variable "instance_type" {
  description = "EC2 instance type for ECS nodes"
  type        = string
  default     = "t2.micro"
}

# variable "subnet_ids" {
#   description = "List of subnet IDs for ECS nodes"
#   type        = list(string)
# }

# variable "vpc_id" {
#   description = "VPC ID for the ECS cluster"
#   type        = string
# }

# variable "ecr_repository_url" {
#   description = "ECR repository URL for the custom image"
#   type        = string
# }


############################################
# ECR variables
############################################
variable "image_tag_mutability" {
  description = "Image tag mutability setting"
  type        = string
  default     = "MUTABLE"
}

variable "encryption_type" {
  description = "Encryption type for ECR"
  type        = string
  default     = "AES256"
}

variable "scan_on_push" {
  description = "Whether to scan images on push"
  type        = bool
  default     = true
}

