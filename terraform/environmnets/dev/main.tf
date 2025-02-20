terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.0.0"
}

provider "aws" {
  region = "us-east-1"
  profile = "Nonprod-devops"
  assume_role {
    role_arn = "arn:aws:iam::783764611086:role/terraform-deploy"
    session_name = "terraform-deploy"
  }
}

module "ec2_instance" {
    source = "../../modules/ec2"
    ami_id = var.ami_id
    instance_type  = var.instance_type
    instance_name  = var.instance_name
    
}

# module "test-s3" {
#     source = "../../modules/ec2"
#     bucket = "my-tf-test-bucket"
  
# }
