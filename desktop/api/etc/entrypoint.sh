#!/bin/sh

aerich upgrade 2>/dev/null || {
  rm -rf migrations/models
  aerich init -t core.database.TORTOISE_ORM
  aerich init-db
  echo "Aerich initialized for PostgreSQL"
}
uvicorn main:app --host 0.0.0.0 --port 8000
