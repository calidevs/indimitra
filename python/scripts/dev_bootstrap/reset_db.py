from app.db.session import engine
from app.db.base import Base
from app.db import models
from sqlalchemy import text

def reset_db():
    print("Dropping all tables...")
    # Use raw SQL with CASCADE to force drop all tables regardless of dependencies
    with engine.connect() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
        conn.commit()
    
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("Database reset complete.")

if __name__ == "__main__":
    reset_db()