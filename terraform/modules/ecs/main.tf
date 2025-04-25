# ###############################
# # IAM Role for EC2 Instances (ECS Instance Role)
# ###############################
data "aws_iam_policy" "ecsInstanceRolePolicy" {
  arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"
}

data "aws_iam_policy" "ec2_instance_connect" {
  arn = "arn:aws:iam::aws:policy/EC2InstanceConnect"
}


data "aws_iam_policy_document" "ecsInstanceRolePolicy" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ecsInstanceRole" {
  name               = "ecsInstanceRole"
  path               = "/"
  assume_role_policy = data.aws_iam_policy_document.ecsInstanceRolePolicy.json
}

resource "aws_iam_role_policy_attachment" "ecsInstancePolicy" {
  role       = aws_iam_role.ecsInstanceRole.name
  policy_arn = data.aws_iam_policy.ecsInstanceRolePolicy.arn
}

resource "aws_iam_role_policy_attachment" "ec2_instance_connect" {
  role       = aws_iam_role.ecsInstanceRole.name
  policy_arn = data.aws_iam_policy.ec2_instance_connect.arn
}

resource "aws_iam_instance_profile" "ecsInstanceRoleProfile" {
  name = aws_iam_role.ecsInstanceRole.name
  role = aws_iam_role.ecsInstanceRole.name
}

resource "aws_iam_role_policy_attachment" "ecs_instance_cloudwatch_policy" {
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"
  role       = aws_iam_role.ecsInstanceRole.name
}

# ############################################
# # IAM Role for ECS Tasks (Task Execution Role)
# ############################################
data "aws_iam_policy" "ecsTaskExecutionRolePolicy" {
  arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

data "aws_iam_policy" "cognito_power_user" {
  arn = "arn:aws:iam::aws:policy/AmazonCognitoPowerUser"
}

data "aws_iam_policy_document" "ecsExecutionRolePolicy" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}
resource "aws_iam_role" "ecsTaskExecutionRole" {
  name               = "ecsTaskExecutionRole"
  path               = "/"
  assume_role_policy = data.aws_iam_policy_document.ecsExecutionRolePolicy.json
}
resource "aws_iam_role_policy_attachment" "ecsTaskExecutionPolicy" {
  role       = aws_iam_role.ecsTaskExecutionRole.name
  policy_arn = data.aws_iam_policy.ecsTaskExecutionRolePolicy.arn
}
resource "aws_iam_role_policy_attachment" "ecsTaskExecutionPolicy_2" {
  role       = aws_iam_role.ecsTaskExecutionRole.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"
}

resource "aws_iam_role_policy_attachment" "ecsTaskExecutionPolicy_cognito" {
  role       = aws_iam_role.ecsTaskExecutionRole.name
  policy_arn = data.aws_iam_policy.cognito_power_user.arn
}

# ###############################
# # ECS Cluster
# ###############################
resource "aws_ecs_cluster" "ecs_cluster" {
  name = "${var.name_prefix}-ecs-cluster"
}

# ###############################
# # Launch Template for EC2 Instances
# ###############################
resource "aws_launch_template" "ecs_launch_template" {
  name_prefix   = "${var.name_prefix}-ecs-launch-template"
  image_id      = data.aws_ami.ecs_optimized.id
  instance_type = var.instance_type
  key_name      = aws_key_pair.key_pair.key_name
  iam_instance_profile {
    name = aws_iam_instance_profile.ecsInstanceRoleProfile.name
  }

  user_data = base64encode(<<-EOT
              #!/bin/bash
              echo "ECS_CLUSTER=${aws_ecs_cluster.ecs_cluster.name}" >> /etc/ecs/ecs.config
              EOT
            )

  network_interfaces {
    associate_public_ip_address = true
    security_groups             = var.security_groups
    subnet_id                   = "subnet-091c76363153c0ffb"
  }
}

# ####################################################
# # Create cloudWatch Log Group
# ####################################################
resource "aws_cloudwatch_log_group" "log" {
  name              = "/${var.name_prefix}"
  retention_in_days = 14
}
# ###############################
# # EC2 Optimized AMI
# ###############################
data "aws_ami" "ecs_optimized" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-ecs-hvm-*-x86_64-ebs"]
  }
}

### ##################################
## aws key_pair
### ##################################
resource "aws_key_pair" "key_pair" {
  key_name   = "ec2-key-pair"
  public_key = file("./my-key.pub")
}

# ##################################
# # ECS Auto Scaling Group
# ##################################
resource "aws_autoscaling_group" "ecs_asg" {
  desired_capacity     = 1
  max_size             = 1
  min_size             = 1
  # vpc_zone_identifier  = var.subnet_ids
  availability_zones = [
    "us-east-1a",  # Example AZ 1
  ]
  launch_template {
    id      = aws_launch_template.ecs_launch_template.id
    version = "$Latest"
  }

  tag {
    key                 = "AmazonECSCluster"
    value               = aws_ecs_cluster.ecs_cluster.name
    propagate_at_launch = true
  }
}

# ###############################
# # ECS Task Definition (Container Definitions)
# ###############################
resource "aws_ecs_task_definition" "nginx" {
  family                   = "${var.name_prefix}-task"
  network_mode             = "bridge"
  requires_compatibilities = ["EC2"]

  task_role_arn      = aws_iam_role.ecsTaskExecutionRole.arn
  execution_role_arn = aws_iam_role.ecsTaskExecutionRole.arn
  container_definitions = var.container_definitions
    volume {
    name      = "ssl-certificates"
    host_path = "/etc/letsencrypt"
  }

}

# ###############################
# # ECS Service
# ###############################
resource "aws_ecs_service" "ecs_service" {
  name            = "${var.name_prefix}-ecs-service"
  cluster         = aws_ecs_cluster.ecs_cluster.id
  task_definition = aws_ecs_task_definition.nginx.arn
  desired_count   = var.desired_count
  launch_type     = "EC2"


  # network_configuration {
  #   subnets          = ["subnet-091c76363153c0ffb"]
  #   # security_groups  = var.security_groups
  #   assign_public_ip = true
  # }
}
