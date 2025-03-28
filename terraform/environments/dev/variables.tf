variable "region" {
  description = "The CIDR block for the VPC. Default value is a valid CIDR, but not acceptable by AWS and should be overriden"
  type        = string
  default     = "us-east-1"
}

#declare ec2 variables
# variable "ami_id" {
#   description = "The AMI ID to use for the instance"
#   type        = string
# }

# variable "instance_type" {
#   description = "The type of instance"
#   type        = string
# }

# variable "instance_name" {
#   description = "The name of the EC2 instance"
#   type        = string
# }

#declare db variables
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

variable "tags" {
  description = "A map of tags to assign to the RDS instance"
  type        = map(string)
  default     = {
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}
