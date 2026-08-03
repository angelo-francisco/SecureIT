from pathlib import Path

from core import embedded_db


def test_pg_log_path_is_outside_pgdata():
    log = embedded_db._pg_log_path()
    pgdata = embedded_db._pgdata_dir()
    assert log.name == "pgserver.log"
    assert log != pgdata / "log"
    assert not str(log).lower().startswith(str(pgdata.resolve()).lower())
    assert log.parent == Path.home() / ".secureit"


def test_pg_ctl_timeout_patch_applies_default():
    import pgserver.postgres_server as _ps

    original = _ps.pg_ctl
    try:
        def _fake(*args, **kwargs):
            return kwargs

        _ps.pg_ctl = _fake
        embedded_db._ensure_pg_ctl_timeout()
        wrapper = _ps.pg_ctl
        assert wrapper is not _fake

        result = wrapper(["start"])
        assert result["timeout"] == embedded_db._PG_CTL_TIMEOUT

        explicit = wrapper(["start"], timeout=42)
        assert explicit["timeout"] == 42
    finally:
        _ps.pg_ctl = original
        embedded_db._pg_ctl_patched = False
