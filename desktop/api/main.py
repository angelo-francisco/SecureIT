import os

import core.win_hidden  # noqa: F401  (Windows: hide child console windows)
import uvicorn
from apps import ROUTERS
from core.bootstrap import bootstrap_database
from core.config import settings
from core.lifespan import lifespan
from core.middleware import control_middleware
from core.routes import system_router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles


def create_app() -> FastAPI:
    app = FastAPI(
        title="SecureIT API",
        description="API do sistema de segurança SecureIT",
        version="0.0.1",
        lifespan=lifespan,
    )

    app.middleware("http")(control_middleware)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    for router in ROUTERS:
        app.include_router(router, prefix="/api")

    app.include_router(system_router)

    settings.MEDIA_ROOT.mkdir(parents=True, exist_ok=True)
    app.mount(
        "/media", StaticFiles(directory=str(settings.MEDIA_ROOT), html=False), name="media"
    )

    bootstrap_database(app)
    return app


app = create_app()


def main() -> None:
    port = settings.PORT or int(os.environ.get("PORT", 8000))
    uvicorn.run(
        app, host="0.0.0.0", port=port, reload=False, log_level="info", lifespan="on"
    )


if __name__ == "__main__":
    main()
