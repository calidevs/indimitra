#aws region
region = "us-east-1"

#ec2 variables
# instance_type = "t2.micro"
# instance_name = "demo-ec2"

#db variables
identifier = "dev-cognito"
allocated_storage = "5"
engine_version = "16.3"
engine = "postgres"
instance_class = "db.t3.micro"
db_name = "dev_userpool_db"
username = "postgres"
POSTGRES_HOST="dummy-db.ci528kc2ig6e.us-east-1.rds.amazonaws.com"
#s3 variables
bucket = "frontend-indimitra"
s3_tags = {
  Environment = "dev"
  Name = "frontend-indimitra"
}

ecr_app = "783764611086.dkr.ecr.us-east-1.amazonaws.com/dev-indimitra-ecr"
ecr_ngnix = "783764611086.dkr.ecr.us-east-1.amazonaws.com/dev-ngnix-indimitra-ecr"
instance_type = "t3.small"