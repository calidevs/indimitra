variable "env" {
  description = "Environment (dev or prod)"
  type        = string
}

variable "name_prefix" {}
variable "description" {}
variable "vpc_id" {}

variable "ingress_rules" {
  description = "List of ingress rules"
  type = list(object({
    from_port       = number
    to_port         = number
    protocol        = string
    cidr_blocks     = list(string)
    security_groups = optional(list(string))
  }))
}

variable "egress_rules" {
  description = "List of egress rules"
  type = list(object({
    from_port   = number
    to_port     = number
    protocol    = string
    cidr_blocks = list(string)
    security_groups = optional(list(string))
  }))
}

variable "tags" {
  type = map(string)
}
