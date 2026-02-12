import os
from sqlalchemy.engine import URL
from dotenv import load_dotenv

# Load environment variables from the .env file (make sure to create .env file in project root)
load_dotenv()

def get_database_url():
    return URL.create(
        drivername="postgresql",
        username=os.getenv("POSTGRES_USER"),
        password=os.getenv("POSTGRES_PASSWORD"),
        host=os.getenv("POSTGRES_HOST"),
        port=os.getenv("POSTGRES_PORT"),
        database=os.getenv("POSTGRES_DB"),
    )

DATABASE_URL = get_database_url().render_as_string(hide_password=False)

# AWS Cognito Configuration
AWS_REGION = os.getenv("AWS_REGION")
COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID")
COGNITO_USER_POOL_CLIENT_ID = os.getenv("COGNITO_USER_POOL_CLIENT_ID")

# Encryption
PAYMENT_ENCRYPTION_SECRET_NAME = os.getenv("PAYMENT_ENCRYPTION_SECRET_NAME", "indimitra/payment-encryption-key")

# Validate required Cognito configuration at startup
def validate_cognito_config():
    """Validate that required AWS Cognito environment variables are set"""
    # Allow running without Cognito in local development
    if os.getenv("SKIP_COGNITO_VALIDATION", "false").lower() == "true":
        print("⚠️  WARNING: Skipping Cognito validation - authentication disabled!")
        return

    required_vars = {
        "AWS_REGION": AWS_REGION,
        "COGNITO_USER_POOL_ID": COGNITO_USER_POOL_ID,
        "COGNITO_USER_POOL_CLIENT_ID": COGNITO_USER_POOL_CLIENT_ID
    }

    missing_vars = [var_name for var_name, var_value in required_vars.items() if not var_value]

    if missing_vars:
        raise ValueError(
            f"Missing required Cognito configuration: {', '.join(missing_vars)}. "
            f"Please set these environment variables in your .env file or set SKIP_COGNITO_VALIDATION=true for local development."
        )

# Run validation on module import
validate_cognito_config()