#!/bin/sh

uv run aerich upgrade 2>/dev/null || {
  rm -rf migrations/models
  uv run aerich init -t core.database.TORTOISE_ORM
  uv run aerich init-db
  uv run aerich upgrade
}

uv run main.py
