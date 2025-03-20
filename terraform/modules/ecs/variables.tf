variable "region" {
  description = "The AWS region to deploy resources in"
  type        = string
  default     = "us-west-1"
}

variable "key_name" {
  description = "The name of the key pair to use for the instance"
  type        = string
}

variable "postgres_db" {
  description = "The name of the PostgreSQL database"
  type        = string
}

variable "postgres_user" {
  description = "The PostgreSQL username"
  type        = string
}

variable "postgres_password" {
  description = "The PostgreSQL password"
  type        = string
}

variable "postgres_host" {
  description = "The PostgreSQL host"
  type        = string
}

variable "postgres_port" {
  description = "The PostgreSQL port"
  type        = string
  default     = "5432"
}
