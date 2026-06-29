#!/bin/sh
# Try aerich upgrade, fallback to init if not yet initialized
aerich upgrade 2>/dev/null || {
  aerich init -t core.database.TORTOISE_ORM 2>/dev/null
  aerich init-db 2>/dev/null
  echo "Aerich initialized for PostgreSQL"
}
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
