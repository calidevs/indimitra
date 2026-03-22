"""
1) Remove all tables (public schema)
2) Apply latest Alembic migrations
3) Load bootstrap seed data

Uses ``python/.env`` for POSTGRES_* and other secrets (``load_dotenv`` with override).

Run from ``python/``:

    python scripts/dev_bootstrap/full_reset.py

**Warning:** Destroys all data in the target database's ``public`` schema.
"""
from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

PYTHON_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PYTHON_ROOT) not in sys.path:
    sys.path.insert(0, str(PYTHON_ROOT))

from dotenv import load_dotenv

load_dotenv(PYTHON_ROOT / ".env", override=True)


def _load(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load {path}")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def main() -> None:
    reset_mod = _load("reset_db", PYTHON_ROOT / "scripts" / "dev_bootstrap" / "reset_db.py")
    reset_mod.reset_db()

    boot_mod = _load("bootstrap", PYTHON_ROOT / "scripts" / "dev_bootstrap" / "bootstrap.py")
    boot_mod.create_data()

    print("Done: wiped schema, applied migrations, loaded bootstrap data.", flush=True)


if __name__ == "__main__":
    main()
