# Dev database: reset + migrate + seed

Configuration comes from **`python/.env`** (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`). Scripts call `load_dotenv(..., override=True)` so that file is the source of truth for DB access (e.g. dev RDS `dummy-db` and database `IndiMart2`).

## Full reset (remove all tables → latest migrations → bootstrap)

```bash
cd python
python scripts/dev_bootstrap/full_reset.py
```

## Reset schema + migrations only (no seed)

```bash
cd python
python scripts/dev_bootstrap/reset_db.py
```

## Seed only (after migrations)

```bash
cd python
python scripts/dev_bootstrap/bootstrap.py
```

## Manual Alembic

```bash
cd python/app/db
alembic upgrade head
```

**Warning:** `full_reset` / `reset_db` drop the entire **`public`** schema. Use only on databases you are allowed to wipe.
