# VPC Configuration (using the default VPC)
resource "aws_vpc" "default" {
  tags = {
    Name = "default-vpc"
  }
}

# Security group for ECS (nginx and api)
resource "aws_security_group" "ecs_sg" {
  name_prefix = "ecs-sg"
  vpc_id      = aws_vpc.default.id

  # Allow inbound traffic on HTTP (80) and backend (8000) ports
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow outbound traffic (needed for ECS tasks)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "ECS-SG"
  }
}

# Create an ECS Cluster
resource "aws_ecs_cluster" "default" {
  name = "my-ecs-cluster"
}

# ECS Instance Role for EC2
resource "aws_iam_role" "ecs_instance_role" {
  name = "ecs-instance-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

# Attach the ECS instance policy to the role
resource "aws_iam_role_policy_attachment" "ecs_instance_role_policy" {
  role       = aws_iam_role.ecs_instance_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"
}

# EC2 Instance for ECS
resource "aws_instance" "ecs_instance" {
  ami           = "ami-0c55b159cbfafe1f0" # Replace with the appropriate ECS-optimized AMI for your region
  instance_type = "t2.micro" # You can choose any other instance type based on your requirements
  key_name      = "your-ssh-key" # Replace with your SSH key name
  subnet_id     = "subnet-xxxxxx" # Use your subnet ID here
  security_groups = [aws_security_group.ecs_sg.name]

  iam_instance_profile = aws_iam_role.ecs_instance_role.name

  tags = {
    Name = "ECS-Instance"
  }
}

# ECS Task Definition (for the API and Nginx containers)
resource "aws_ecs_task_definition" "api_task" {
  family                   = "api-task"
  network_mode             = "bridge" # Use bridge mode for EC2 launch type
  cpu                      = "256"
  memory                   = "512"
  requires_compatibilities = ["EC2"]
  execution_role_arn       = aws_iam_role.ecs_instance_role.arn
  task_role_arn            = aws_iam_role.ecs_instance_role.arn

  container_definitions = jsonencode([
    {
      name      = "api"
      image     = "your-api-image:latest"
      essential = true
      portMappings = [
        {
          containerPort = 8000
          hostPort      = 8000
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "POSTGRES_DB"
          value = "Indm"
        },
        {
          name  = "POSTGRES_USER"
          value = "postgres"
        },
        {
          name  = "POSTGRES_PASSWORD"
          value = "your-db-password"
        },
        {
          name  = "POSTGRES_HOST"
          value = "your-db-host"
        }
      ]
    },
    {
      name      = "nginx"
      image     = "nginx:latest"
      essential = true
      portMappings = [
        {
          containerPort = 80
          hostPort      = 80
          protocol      = "tcp"
        }
      ]
      volumesFrom = [
        {
          sourceContainer = "api"
        }
      ]
    }
  ])
}

# ECS Service (running on EC2 instances)
resource "aws_ecs_service" "api_service" {
  name            = "api-service"
  cluster         = aws_ecs_cluster.default.id
  task_definition = aws_ecs_task_definition.api_task.arn
  desired_count   = 1
  launch_type     = "EC2"

  network_configuration {
    subnets          = ["subnet-xxxxxx"]  # Add your subnet IDs here
    security_groups = [aws_security_group.ecs_sg.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = "your-target-group-arn" # You can configure an Application Load Balancer if you want
    container_name   = "nginx"
    container_port   = 80
  }

  depends_on = [
    aws_instance.ecs_instance
  ]
}
