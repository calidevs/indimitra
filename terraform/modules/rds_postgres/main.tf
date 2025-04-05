data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

resource "aws_db_subnet_group" "this" {
  name       = "${var.identifier}-subnet-group"
  subnet_ids = data.aws_subnets.default.ids
  tags = {
    Name        = "${var.identifier}-subnet-group"
    Environment = var.env
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
  vpc_security_group_ids  = var.vpc_security_group_ids
  db_subnet_group_name    = aws_db_subnet_group.this.name
  tags = merge(
    var.tags,
    { Environment = var.env }
  )
}
  
