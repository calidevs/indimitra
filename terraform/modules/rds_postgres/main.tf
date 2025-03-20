# Security group for RDS instance
resource "aws_security_group" "rds_sg" {
  name_prefix = "rds-sg"
  vpc_id      = aws_vpc.default.id

  # Allow inbound traffic from ECS only (on port 5432)
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    security_groups = [aws_security_group.ecs_sg.id]
  }

  # Allow outbound traffic if needed (e.g., backup or other services)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "RDS-SG"
  }
}

resource "aws_db_instance" "rds_postgres" {
  identifier = var.identifier
  allocated_storage      = var.allocated_storage
  engine                = "postgres"
  engine_version        = var.engine_version
  instance_class        = var.instance_class
  db_name               = var.db_name
  username              = var.username
  password              = var.password
  storage_encrypted     = true
  skip_final_snapshot   = true 
  publicly_accessible = true
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  tags = var.tags
  
}