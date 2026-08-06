"""Central registry of active WebSocket managers per camera.

Lets camera deletion (or any backend action) gracefully close every live
connection streaming from a camera.
"""

import asyncio

_managers: dict[int, list[object]] = {}
_lock = asyncio.Lock()


async def register_manager(camera_id: int, manager: object) -> None:
    if camera_id is None:
        return
    async with _lock:
        _managers.setdefault(camera_id, []).append(manager)


async def unregister_manager(camera_id: int, manager: object) -> None:
    if camera_id is None:
        return
    async with _lock:
        managers = _managers.get(camera_id)
        if managers and manager in managers:
            managers.remove(manager)
        if not managers:
            _managers.pop(camera_id, None)


async def close_camera_connections(camera_id: int) -> None:
    """Gracefully close every manager streaming from ``camera_id``."""
    async with _lock:
        managers = list(_managers.pop(camera_id, []))
    for manager in managers:
        try:
            await manager.close(reason="camera_deleted")
        except Exception:
            pass
