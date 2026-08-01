import os
import subprocess


def apply_hidden_window_patch() -> None:
    """Make every subprocess spawned by the API run without a console window.

    The desktop launcher spawns this API as a background process (with the
    CREATE_NO_WINDOW flag). However, child processes that this API spawns
    (the embedded PostgreSQL tools initdb/pg_ctl/postgres, ffmpeg, ...) are
    console applications and, on Windows, would normally get their own
    console window. This patch forces CREATE_NO_WINDOW on all subprocesses so
    no terminal windows ever flash while the desktop app is running.

    Safe: callers that explicitly set their own ``creationflags`` are left
    untouched; this only defaults the flag when it was not provided.
    """
    if os.name != "nt":
        return

    _orig_init = subprocess.Popen.__init__
    _no_window = getattr(subprocess, "CREATE_NO_WINDOW", 0x08000000)

    def _popen_init(self, *args, **kwargs):  # type: ignore[no-untyped-def]
        if not kwargs.get("creationflags"):
            kwargs["creationflags"] = _no_window
        _orig_init(self, *args, **kwargs)

    subprocess.Popen.__init__ = _popen_init  # type: ignore[method-assign]


apply_hidden_window_patch()
