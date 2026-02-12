from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, Session
from app.config import DATABASE_URL
from typing import Generator

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def set_tenant_context(db: Session, store_id: int) -> None:
    """
    Set the tenant context for Row Level Security filtering.

    This sets a PostgreSQL session variable that RLS policies use to filter
    store table rows. Must be called per-request for store-specific operations.

    Args:
        db: SQLAlchemy database session
        store_id: The store ID to set as current tenant

    Note: Uses parameterized query (not f-string) to prevent SQL injection,
          even though store_id should always be an integer.
    """
    db.execute(text("SET LOCAL app.current_tenant_id = :sid"), {"sid": store_id})


def reset_tenant_context(db: Session) -> None:
    """
    Reset the tenant context, allowing access to all stores.

    This is called when connections are returned to the pool to prevent
    tenant context leakage between requests.

    Args:
        db: SQLAlchemy database session
    """
    db.execute(text("RESET app.current_tenant_id"))


@event.listens_for(engine, "checkin")
def receive_checkin(dbapi_connection, connection_record):
    """
    Reset tenant context when connection returns to pool.

    This prevents cross-tenant data leakage by ensuring each connection
    starts fresh without any tenant context from previous use.
    """
    cursor = dbapi_connection.cursor()
    cursor.execute("RESET app.current_tenant_id")
    cursor.close()
