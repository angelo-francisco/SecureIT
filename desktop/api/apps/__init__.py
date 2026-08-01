from audit.router import router as audit_router
from cameras.router import router as cameras_router
from control.router import router as control_router
from face_detection.router import router as face_detection_router
from license.router import router as license_router
from notifications.router import router as notifications_router
from panel.router import router as panel_router
from people.router import router as people_router

__all__ = [
    "audit_router",
    "cameras_router",
    "control_router",
    "face_detection_router",
    "license_router",
    "notifications_router",
    "panel_router",
    "people_router",
]

ROUTERS = [
    control_router,
    cameras_router,
    face_detection_router,
    notifications_router,
    panel_router,
    people_router,
    audit_router,
    license_router,
]
