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
  tags = var.tags
}