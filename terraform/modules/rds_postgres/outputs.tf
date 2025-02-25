# output "instance_id" {
#   value = aws_instance.example.id
# }

# output "public_ip" {
#   value = aws_instance.example.public_ip
# }
output "identifier" {
  description = "The identifier for the RDS instance"
  value       = aws_db_instance.rds_postgres.identifier
}

output "allocated_storage" {
  description = "The allocated storage for the RDS instance"
  value       = aws_db_instance.rds_postgres.allocated_storage
}

output "engine" {
  description = "The engine used for the RDS instance"
  value       = aws_db_instance.rds_postgres.engine
}

output "engine_version" {
  description = "The engine version for the RDS instance"
  value       = aws_db_instance.rds_postgres.engine_version
}

output "instance_class" {
  description = "The class of the RDS instance"
  value       = aws_db_instance.rds_postgres.instance_class
}

output "db_name" {
  description = "The name of the RDS instance database"
  value       = aws_db_instance.rds_postgres.db_name
}

output "username" {
  description = "The username for the RDS instance"
  value       = aws_db_instance.rds_postgres.username
}

output "password" {
  description = "The password for the RDS instance"
  value       = aws_db_instance.rds_postgres.password
}

output "storage_encrypted" {
  description = "Whether the RDS instance storage is encrypted"
  value       = aws_db_instance.rds_postgres.storage_encrypted
}

output "skip_final_snapshot" {
  description = "Whether to skip the final snapshot before deleting the RDS instance"
  value       = aws_db_instance.rds_postgres.skip_final_snapshot
}

output "tags" {
  description = "The tags assigned to the RDS instance"
  value       = aws_db_instance.rds_postgres.tags
}

