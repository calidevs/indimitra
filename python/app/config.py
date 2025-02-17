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

DATABASE_URL = get_database_url()