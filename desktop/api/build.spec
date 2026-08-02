# -*- mode: python ; coding: utf-8 -*-
"""PyInstaller spec for the SecureIT desktop API.

Builds a self-contained onedir bundle that the Tauri launcher spawns:
  pyinstaller build.spec

The bundle ships a real PostgreSQL (via pgserver, which bundles the
pgvector extension) so no external services are required at runtime.
"""

from pathlib import Path

import pgserver
from PyInstaller.utils.hooks import (
    collect_all,
    collect_data_files,
    collect_dynamic_libs,
    collect_submodules,
)

datas = []
binaries = []
hiddenimports = []

# Packages that load resources/plugins dynamically.
for pkg in ("tortoise", "aerich", "facenet_pytorch", "ultralytics", "cv2"):
    d, b, h = collect_all(pkg)
    datas += d
    binaries += b
    hiddenimports += h

hiddenimports += collect_submodules("uvicorn")
hiddenimports += collect_submodules("websockets")
hiddenimports += collect_submodules("asyncpg")
hiddenimports += collect_submodules("pgserver")

# pgserver: collect code + native libs, but skip pginstall (handled by the
# directory copy below to preserve the full layout and executable bits of
# postgres). Normalize separators so the exclusion also works on Windows.
pgserver_datas = [
    d for d in collect_data_files("pgserver") if "pginstall" not in d[0].replace("\\", "/")
]
datas += pgserver_datas
binaries += collect_dynamic_libs("pgserver")

# Full PostgreSQL install (bin + lib + share + extensions incl. vector).
pg_install = Path(pgserver.__file__).parent / "pginstall"
if pg_install.exists():
    datas.append((str(pg_install), "pgserver/pginstall"))
    # Postgres loads timezone abbreviations (timezone_abbreviations='Default')
    # from this directory at runtime. A bundle missing it makes every backend
    # fail to start and the app boot hangs; fail the build loudly instead.
    tz_sets = pg_install / "share" / "postgresql" / "timezonesets"
    if not (tz_sets / "Default").exists():
        raise SystemExit(
            f"Incomplete pgserver install: missing {tz_sets / 'Default'}"
        )

# Project data: YOLO weights, facenet weights, aerich migrations.
api_root = Path.cwd()
datas += [
    (str(api_root / "models"), "models"),
    (str(api_root / "migrations"), "migrations"),
]

# Runtime env (DATABASE_URL, WEB_URL, ED25519_PUBLIC_KEY, ...). Created by
# the release workflow from the API_ENV_FILE secret; read via env_file in
# core/config.py.
if (api_root / ".env").exists():
    datas.append((str(api_root / ".env"), "."))


a = Analysis(
    ["main.py"],
    pathex=[str(api_root)],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=["matplotlib", "tkinter", "IPython", "jupyter"],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=None,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=None)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="desktop-api",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name="desktop-api",
)
