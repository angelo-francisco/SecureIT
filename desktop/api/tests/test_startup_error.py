from core.config import settings
from core.database import db_error_hint


def test_db_error_hint_points_to_embedded_db_when_enabled():
    original = settings.EMBEDDED_DB
    try:
        settings.EMBEDDED_DB = True
        msg = db_error_hint(OSError("connection refused"))
        assert "pgserver.log" in msg
        assert "EMBEDDED_DB" in msg
    finally:
        settings.EMBEDDED_DB = original


def test_db_error_hint_explains_docker_only_host_when_disabled():
    original = settings.EMBEDDED_DB
    original_url = settings.DATABASE_URL
    try:
        settings.EMBEDDED_DB = False
        settings.DATABASE_URL = "postgres://secureit:secureit@db:5432/secureit"
        msg = db_error_hint(OSError("Name or service not known"))
        assert "'db'" in msg
        assert "Docker" in msg
        assert "EMBEDDED_DB" in msg
    finally:
        settings.EMBEDDED_DB = original
        settings.DATABASE_URL = original_url
