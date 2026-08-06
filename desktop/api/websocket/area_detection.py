import asyncio
import logging
from asyncio import CancelledError, create_task, sleep as async_sleep
from datetime import datetime
from time import time
from zoneinfo import ZoneInfo

from fastapi import WebSocket, WebSocketDisconnect

from core.config import settings
from websocket.helpers import (
    authenticate,
    create_camera_service,
    create_notification,
    get_user_camera,
    load_user_config,
    set_camera_status,
    websocket_watchdog,
)
from websocket.registry import register_manager, unregister_manager

logger = logging.getLogger(__name__)


class AreaDetectionManager:
    def __init__(self, websocket: WebSocket):
        self.ws = websocket
        self.running = False
        self.camera_service = None
        self.camera = None
        self.task = None
        self.profile_id = None
        self.camera_id = None
        self.frame_index = 0
        self.last_alert = 0.0
        self.last_people_count = 0
        self.fps = 15
        self.alert_cooldown = 5
        self.detect_every = 3
        self.allow_draw = True
        self.mst = None
        self.met = None
        self.frame_errors = 0
        self._stop = asyncio.Event()
        self._watchdog_task = None

    async def close(self, reason: str = ""):
        self._stop.set()
        if self.task:
            self.task.cancel()
        try:
            await self.ws.close(code=1000, reason=reason)
        except Exception:
            pass

    async def _cleanup(self, reason: str = ""):
        self.running = False
        self._stop.set()
        if self.camera_service:
            self.camera_service.stop()
            self.camera_service = None
        if self.task:
            self.task.cancel()
            self.task = None
        if self.camera_id:
            await unregister_manager(self.camera_id, self)
        await set_camera_status(self.camera, False)

    def _is_monitoring_time(self) -> bool:
        now = datetime.now(ZoneInfo(settings.TIME_ZONE)).time()
        if not self.mst or not self.met:
            return True
        try:
            start = datetime.strptime(self.mst, "%H:%M").time()
            end = datetime.strptime(self.met, "%H:%M").time()
        except (ValueError, TypeError):
            return True
        if start <= end:
            return start <= now < end
        return now >= start or now < end

    def _check_cooldown(self) -> bool:
        return time() - self.last_alert > self.alert_cooldown

    async def stream(self):
        try:
            while self.running:
                self.frame_index += 1
                detect = self.frame_index % self.detect_every == 0

                try:
                    frame, people = self.camera_service.get_frame(detect)
                except Exception as e:
                    self.frame_errors += 1
                    logger.warning(
                        "frame error on camera %s (%d/%d): %s",
                        self.camera_id,
                        self.frame_errors,
                        10,
                        e,
                    )
                    if self.frame_errors >= 10:
                        break
                    await async_sleep(1 / self.fps)
                    continue
                self.frame_errors = 0

                if (
                    detect
                    and people
                    and self._is_monitoring_time()
                    and self._check_cooldown()
                    and people != self.last_people_count
                ):
                    create_task(
                        create_notification(
                            profile_id=self.profile_id,
                            camera_id=self.camera_id,
                            title=f"Detectadas {people} pessoa(s)",
                            description="Possíveis suspeitos em horário de monitoramento",
                            level="S",
                            frame=frame,
                        )
                    )
                    await self.ws.send_text(
                        __import__("json").dumps(
                            {"type": "notification", "people": people}
                        )
                    )
                    self.last_alert = time()
                    self.last_people_count = people

                await self.ws.send_bytes(frame)
                await async_sleep(1 / self.fps)
        except CancelledError:
            pass
        except WebSocketDisconnect:
            await self._cleanup(reason="ws_disconnect")
        finally:
            self.running = False

    async def handle(self):
        params = self.ws.query_params
        profile_id = params.get("pid")
        camera_id = params.get("camera_id")
        video_source = params.get("vs")

        pid = await authenticate(profile_id)
        if not pid:
            await self.ws.close(code=4001)
            return
        self.profile_id = pid

        await self.ws.accept()

        config = await load_user_config(self.profile_id)
        self.fps = config.get("fps", self.fps)
        self.alert_cooldown = config.get("alert_cooldown", self.alert_cooldown)
        self.detect_every = config.get("detect_every", self.detect_every)
        self.allow_draw = config.get("allow_draw", self.allow_draw)
        self.mst = config.get("monitoring_start_time")
        self.met = config.get("monitoring_end_time")

        try:
            if camera_id:
                self.camera_id = int(camera_id)
                self.camera = await get_user_camera(self.camera_id, self.profile_id)
                if not self.camera:
                    pass

            self.camera_service = create_camera_service(
                video_source, fps=self.fps, allow_draw=self.allow_draw
            )
            await set_camera_status(self.camera, True)
        except Exception:
            await set_camera_status(self.camera, False)
            await self.ws.close(code=4001)
            return

        self.running = True
        if self.camera_id:
            await register_manager(self.camera_id, self)
        self.task = create_task(self.stream())
        self._watchdog_task = create_task(
            websocket_watchdog(self.ws, self._stop, self._cleanup)
        )

        try:
            await self.task
        except (CancelledError, WebSocketDisconnect):
            pass
        finally:
            self._stop.set()
            if self._watchdog_task:
                self._watchdog_task.cancel()
            await self._cleanup(reason="handle_end")
