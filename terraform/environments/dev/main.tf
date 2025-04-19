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

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# output "default_subnet_ids" {
#   value = data.aws_subnets.default.ids
# }

module "rds_sg_dev" {
  source        = "../../modules/security_group"
  env           = "dev"
  name_prefix   = "rds-sg"
  description   = "Security group for RDS in dev"
  vpc_id        = data.aws_vpc.default.id

  ingress_rules = [
    {
      from_port       = 5432
      to_port         = 5432
      protocol        = "tcp"
      cidr_blocks     = []
      security_groups = [module.ecs_sg_dev.security_group_id]
    }
  ]

  egress_rules = [
    {
      from_port   = 0
      to_port     = 0
      protocol    = "-1"
      cidr_blocks = ["0.0.0.0/0"]
    }
  ]

  tags = var.tags
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
  vpc_security_group_ids = [module.rds_sg_dev.security_group_id]
  env                 = "dev"

}

module "ecs_sg_dev" {
  source        = "../../modules/security_group"
  env           = "dev"
  name_prefix   = "ecs-sg"
  description   = "Security group for ECS in dev"
  vpc_id        = data.aws_vpc.default.id

  ingress_rules = [
    {
      from_port   = 80
      to_port     = 80
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    },
    {
      from_port   = 8000
      to_port     = 8000
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    },
    {
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    },
    {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    }
  ]

  egress_rules = [
    {
      from_port   = 0
      to_port     = 0
      protocol    = "-1"
      cidr_blocks = ["0.0.0.0/0"]
    }
  ]

  tags = var.tags
}

# output "security_group_id" {
#   value = aws_security_group.ecs_sg_dev.id
# }


module "ecr" {
  source              = "../../modules/ecr"
  name_prefix         = "dev-indimitra"
  image_tag_mutability = var.image_tag_mutability
  encryption_type      = var.encryption_type
  scan_on_push         = var.scan_on_push
  tags                 = var.tags
}

module "ecr_ngnix" {
  source              = "../../modules/ecr"
  name_prefix         = "dev-ngnix-indimitra"
  image_tag_mutability = var.image_tag_mutability
  encryption_type      = var.encryption_type
  scan_on_push         = var.scan_on_push
  tags                 = var.tags
}

locals {
  nginx_container = {
    name      = "nginx"
    image     = "${var.ecr_ngnix}:latest"
    cpu       = 128
    memory    = 256
    essential = true
    links = ["backend"]
    portMappings = [
      {
        containerPort = 80
        hostPort      = 80
      },
      {
        containerPort = 443
        hostPort      = 443
      }
    ]
    "volumes": [
      {
        "name": "ssl-certificates",
        "host_path": {
          "source_path" = "/etc/letsencrypt"
          "destination_path" = "/etc/nginx/certificates"
        }
      }
     ],
    "mountPoints": [
        {
          "sourceVolume": "ssl-certificates",
          "containerPath": "/etc/nginx/certificates",
          "readOnly": false
        }
      ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-create-group"= "true"
        "awslogs-group"         = "${module.ecs.aws_cloudwatch_log_group}/nginx"                # Log group name
        "awslogs-region"        = "us-east-1"                  # AWS region
        "awslogs-stream-prefix" = "nginx"                      # Stream prefix for logs
      }
    }
    healthCheck = {
      command     = ["CMD", "curl", "-f", "http://localhost:80/"]
      interval    = 30  # Time between each health check
      retries     = 3   # Number of retries before considering unhealthy
      startPeriod = 10  # Time to wait before starting the health checks
      timeout     = 5   # Timeout for each health check request
    }
  }

  custom_app_container = {
    name      = "backend"
    image     = "${var.ecr_app}:latest"
    cpu       = 128
    memory    = 256
    essential = true
    portMappings = [
      {
        containerPort = 8000
        hostPort      = 8000
      }
    ]
    environment = [
      {
        name  = "PYTHONUNBUFFERED"
        value = "1"
      },
      {
        name  = "DEBUG"
        value = "1"
      },
      {
        name  = "PYTHONPATH"
        value = "/app"
      },
      {
        name  = "POSTGRES_DB"
        value = "IndiMart"
      },
      {
        name  = "POSTGRES_USER"
        value = "postgres"
      },
      {
        name  = "POSTGRES_PASSWORD"
        value = "${var.password}"
      },
      {
        name  = "POSTGRES_HOST"
        value = "${var.POSTGRES_HOST}"
      },
      {
        name  = "POSTGRES_PORT"
        value = "5432"
      }
    ]
    command = [
      "sh",
      "-c",
      "cd /app && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-create-group"= "true"
        "awslogs-group"         = "${module.ecs.aws_cloudwatch_log_group}/indimitra"          # Log group name
        "awslogs-region"        = "us-east-1"                    # AWS region
        "awslogs-stream-prefix" = "indimitra-app"                # Stream prefix for logs
      }
    }
    healthCheck = {
    command     = ["CMD", "curl", "-f", "http://localhost:8000/graphql"]
    interval    = 30  # Time between each health check
    retries     = 3   # Number of retries before considering unhealthy
    startPeriod = 10  # Time to wait before starting the health checks
    timeout     = 5   # Timeout for each health check request
  }

  }

  container_definitions = jsonencode([local.nginx_container, local.custom_app_container])
}



module "ecs" {
  source              = "../../modules/ecs"  # Adjust the path to your ECS module
  name_prefix         = "dev-indimitra"
  subnet_ids          = data.aws_subnets.default.ids
  security_groups     = [module.ecs_sg_dev.security_group_id]
  container_definitions = local.container_definitions
  instance_type       = var.instance_type
  desired_count       = 1
}

