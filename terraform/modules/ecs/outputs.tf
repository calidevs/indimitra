output "ecs_instance_id" {
  description = "The ID of the ECS instance"
  value       = aws_instance.ecs_instance.id
}

output "ecs_instance_public_ip" {
  description = "The public IP address of the ECS instance"
  value       = aws_instance.ecs_instance.public_ip
}

output "ecs_instance_private_ip" {
  description = "The private IP address of the ECS instance"
  value       = aws_instance.ecs_instance.private_ip
}

output "ecs_cluster_id" {
  description = "The ID of the ECS cluster"
  value       = aws_ecs_cluster.default.id
}

output "ecs_service_name" {
  description = "The name of the ECS service"
  value       = aws_ecs_service.api_service.name
}

output "ecs_task_definition_arn" {
  description = "The ARN of the ECS task definition"
  value       = aws_ecs_task_definition.api_task.arn
}
