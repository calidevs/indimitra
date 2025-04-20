# Set your variables
CLUSTER_NAME="dev-indimitra-ecs-cluster"
SERVICE_NAME="dev-indimitra-ecs-service"

# Get the currently running task ARN
TASK_ARN=$(aws ecs list-tasks \
  --cluster "$CLUSTER_NAME" \
  --service-name "$SERVICE_NAME" \
  --desired-status RUNNING \
  --query "taskArns[0]" \
  --output text)

echo "Found running task: $TASK_ARN"

# Stop the task if it exists
if [ "$TASK_ARN" != "None" ]; then
  aws ecs stop-task \
    --cluster "$CLUSTER_NAME" \
    --task "$TASK_ARN" \
    --reason "Deploying new version of the task"
  echo "Stopped task: $TASK_ARN"
else
  echo "No running tasks found to stop."
fi
