#!/bin/sh
# Try aerich upgrade, fallback to init if not yet initialized
aerich upgrade 2>/dev/null || {
  # Clean stale migrations if switching DB (e.g. SQLite -> PostgreSQL)
  rm -rf migrations/models
  aerich init -t core.database.TORTOISE_ORM
  aerich init-db
  echo "Aerich initialized for PostgreSQL"
}
uvicorn main:app --host 0.0.0.0 --port 8000
