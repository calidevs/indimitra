# ###############################
# # Output for ECS Cluster
# ###############################
output "ecs_cluster_id" {
  description = "The ID of the ECS Cluster"
  value       = aws_ecs_cluster.ecs_cluster.id
}

# ###############################
# # Output for ECS Service
# ###############################
output "ecs_service_name" {
  description = "The name of the ECS Service"
  value       = aws_ecs_service.ecs_service.name
}

# ###############################
# # Output for ECS Task Definition ARN
# ###############################
output "ecs_task_definition_arn" {
  description = "The ARN of the ECS Task Definition"
  value       = aws_ecs_task_definition.nginx.arn
}

# ###############################
# # Output for Launch Template ID
# ###############################
output "ecs_launch_template_id" {
  description = "The ID of the ECS Launch Template"
  value       = aws_launch_template.ecs_launch_template.id
}

# ###############################
# # Output for ECS Instance Role ARN
# ###############################
output "ecs_instance_role_arn" {
  description = "The ARN of the ECS Instance Role"
  value       = aws_iam_role.ecsInstanceRole.arn
}

# ###############################
# # Output for ECS Task Execution Role ARN
# ###############################
output "ecs_task_execution_role_arn" {
  description = "The ARN of the ECS Task Execution Role"
  value       = aws_iam_role.ecsTaskExecutionRole.arn
}

# ###############################
# # Output for the Security Group ID
# ###############################
# # output "ecs_security_group_id" {
# #   description = "The Security Group ID used by ECS instances"
# #   value       = aws_launch_template.ecs_launch_template.
# # }
output "aws_cloudwatch_log_group" {
  description = "The CloudWatch Log Group for ECS"
  value       = aws_cloudwatch_log_group.log.name
}