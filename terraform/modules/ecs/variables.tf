# modules/ecs/variables.tf

variable "name_prefix" {
  description = "Prefix for the ECS resources"
  type        = string
}

variable "container_definitions" {
  description = "Container definitions for ECS Task"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for ECS instances"
  type        = list(string)
}

variable "security_groups" {
  description = "List of security group IDs for ECS instances"
  type        = list(string)
  default = []
}

variable "desired_count" {
  description = "Desired count for ECS service tasks"
  type        = number
  
}
variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default = "t2.micro"
}