"""Entry point for the PyInstaller-bundled desktop API.

PyInstaller cannot resolve string-based imports (e.g. "main:app"),
so this module imports the FastAPI app object directly and starts
uvicorn on the port provided by the Tauri launcher.
"""

import os

import uvicorn

from core.config import settings
from main import app


def main() -> None:
    port = settings.PORT or int(os.environ.get("PORT", 8000))
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info",
    )


if __name__ == "__main__":
    main()
