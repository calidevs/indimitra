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
  region = var.region
  profile = "Nonprod-devops"
  assume_role {
    role_arn = "arn:aws:iam::783764611086:role/terraform-deploy"
    session_name = "terraform-deploy"
  }
}

module "rds_postgres" {
  source              = "../../modules/rds_postgres"
  identifier          = var.identifier
  allocated_storage   = var.allocated_storage
  engine              = var.engine
  db_name             = var.db_name
  engine_version      = var.engine_version
  instance_class      = var.instance_class
  username            = var.username
  password            = var.password
  storage_encrypted   = true
  skip_final_snapshot = true
  tags                = var.tags
}

module "github_oidc" {
  source        = "../../modules/oidc"
  oidc_url      = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
}

module "frontend_bucket" {
  source = "../../modules/s3"
  bucket = var.bucket
  tags = var.s3_tags
}

module "ecs_service" {
  source            = "../../modules/ecs"
  region            = var.region
  key_name          = var.key_name
  postgres_db       = module.rds_postgres.db_name
  postgres_user     = module.rds_postgres.username
  postgres_password = module.rds_postgres.password
  postgres_host     = module.rds_postgres.endpoint
  postgres_port     = module.rds_postgres.port
}
