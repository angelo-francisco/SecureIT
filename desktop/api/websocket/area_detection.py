import logging
from asyncio import CancelledError, create_task, sleep as async_sleep
from datetime import datetime, timezone
from time import time

from fastapi import WebSocket, WebSocketDisconnect

from websocket.helpers import (
    authenticate,
    create_camera_service,
    create_notification,
    get_user_camera,
    load_user_config,
    set_camera_status,
)

logger = logging.getLogger(__name__)


class AreaDetectionManager:
    def __init__(self, websocket: WebSocket):
        self.ws = websocket
        self.running = False
        self.camera_service = None
        self.camera = None
        self.task = None
        self.user_id = None
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

    async def _cleanup(self, reason: str = ""):
        logger.info("[area] cleanup reason=%s user=%s camera=%s", reason, self.user_id, self.camera_id)
        self.running = False
        if self.camera_service:
            self.camera_service.stop()
            self.camera_service = None
        if self.task:
            self.task.cancel()
            self.task = None
        await set_camera_status(self.camera, False)

    def _is_monitoring_time(self) -> bool:
        now = datetime.now(timezone.utc).time()
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
                    logger.warning("[area] get_frame failed user=%s camera=%s err=%s", self.user_id, self.camera_id, e)
                    break

                if detect and people and self._is_monitoring_time() and self._check_cooldown() and people != self.last_people_count:
                    create_task(
                        create_notification(
                            user_id=self.user_id,
                            camera_id=self.camera_id,
                            title=f"Detectadas {people} pessoa(s)",
                            description="Possíveis suspeitos em horário de monitoramento",
                            level="S",
                            frame=frame,
                        )
                    )
                    await self.ws.send_text(
                        __import__("json").dumps({"type": "notification", "people": people})
                    )
                    self.last_alert = time()
                    self.last_people_count = people

                await self.ws.send_bytes(frame)
                await async_sleep(1 / self.fps)
        except CancelledError:
            logger.info("[area] cancelled user=%s camera=%s", self.user_id, self.camera_id)
        except WebSocketDisconnect:
            logger.info("[area] disconnect user=%s camera=%s", self.user_id, self.camera_id)
            await self._cleanup(reason="ws_disconnect")
        finally:
            self.running = False

    async def handle(self):
        params = self.ws.query_params
        token = params.get("token")
        camera_id = params.get("camera_id")
        video_source = params.get("vs")

        logger.info("[area] new connection camera_id=%s vs=%s", camera_id, video_source)

        user_id = await authenticate(token)
        if not user_id:
            await self.ws.close(code=4001)
            return
        self.user_id = user_id

        await self.ws.accept()
        logger.info("[area] accepted user=%s", self.user_id)

        config = await load_user_config(self.user_id)
        self.fps = config.get("fps", self.fps)
        self.alert_cooldown = config.get("alert_cooldown", self.alert_cooldown)
        self.detect_every = config.get("detect_every", self.detect_every)
        self.allow_draw = config.get("allow_draw", self.allow_draw)
        self.mst = config.get("monitoring_start_time")
        self.met = config.get("monitoring_end_time")

        try:
            if camera_id:
                self.camera_id = int(camera_id)
                self.camera = await get_user_camera(self.camera_id, self.user_id)
                if not self.camera:
                    logger.warning("[area] camera not found id=%s", self.camera_id)

            logger.info("[area] opening camera vs=%s fps=%s", video_source, self.fps)
            self.camera_service = create_camera_service(video_source, fps=self.fps, allow_draw=self.allow_draw)
            await set_camera_status(self.camera, True)
            logger.info("[area] camera opened successfully")
        except Exception as e:
            logger.error("[area] failed to open camera: %s", e)
            await set_camera_status(self.camera, False)
            await self.ws.close(code=4001)
            return

        self.running = True
        self.task = create_task(self.stream())
        logger.info("[area] stream started user=%s camera=%s", self.user_id, self.camera_id)

        try:
            await self.task
            logger.info("[area] stream finished user=%s camera=%s", self.user_id, self.camera_id)
        except (CancelledError, WebSocketDisconnect):
            logger.info("[area] handle interrupted user=%s camera=%s", self.user_id, self.camera_id)
        finally:
            await self._cleanup(reason="handle_end")
            logger.info("[area] closed user=%s camera=%s", self.user_id, self.camera_id)
