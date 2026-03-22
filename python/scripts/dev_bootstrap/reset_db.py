"""
Wipe the DB schema and apply all Alembic migrations.

Loads secrets from ``python/.env`` (POSTGRES_*) before connecting — use this for your
dev RDS (e.g. dummy-db + IndiMart2).

Run from ``python/``:

    python scripts/dev_bootstrap/reset_db.py
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

from sqlalchemy import text

PYTHON_ROOT = Path(__file__).resolve().parent.parent.parent

if str(PYTHON_ROOT) not in sys.path:
    sys.path.insert(0, str(PYTHON_ROOT))

from dotenv import load_dotenv

# Use project .env as the secrets file for DB access
load_dotenv(PYTHON_ROOT / ".env", override=True)

from app.db.session import engine


def reset_db() -> None:
    """DROP/CREATE public schema, then ``alembic upgrade head``."""
    print("Removing existing schema (all tables in public)...", flush=True)
    with engine.connect() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
        conn.commit()

    alembic_dir = PYTHON_ROOT / "app" / "db"
    print(f"Applying latest migrations (cwd={alembic_dir})...", flush=True)
    subprocess.run(
        [
            sys.executable,
            "-m",
            "alembic",
            "-c",
            "alembic.ini",
            "upgrade",
            "head",
        ],
        cwd=str(alembic_dir),
        check=True,
    )
    print("Migrations complete.", flush=True)


if __name__ == "__main__":
    reset_db()
