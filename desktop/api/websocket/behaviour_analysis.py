import json
import logging
from asyncio import CancelledError, create_task, sleep as async_sleep
from collections import deque
from time import time

import cv2
import numpy as np
from fastapi import WebSocket, WebSocketDisconnect

from services.yolo import YOLOService
from websocket.helpers import (
    authenticate,
    create_camera_service,
    create_notification,
    get_user_camera,
    load_user_config,
    set_camera_status,
)

logger = logging.getLogger(__name__)


class BehaviourAnalysisManager:
    def __init__(self, websocket: WebSocket):
        self.ws = websocket
        self.running = False
        self.camera_service = None
        self.camera = None
        self.task = None
        self.profile_id = None
        self.camera_id = None
        self.frame_index = 0
        self.fps = 15
        self.detect_every = 5
        self.alert_cooldown = 10
        self.last_alert = 0.0
        self.motion_threshold = 35.0
        self.suspicious_frames_needed = 3
        self.suspicious_counter = 0
        self.prev_gray = None
        self.bg_subtractor = cv2.createBackgroundSubtractorMOG2(
            history=500, varThreshold=50, detectShadows=False
        )
        self._motion_history: deque = deque(maxlen=30)

    async def _cleanup(self, reason: str = ""):
        self.running = False
        if self.camera_service:
            self.camera_service.stop()
            self.camera_service = None
        if self.task:
            self.task.cancel()
            self.task = None
        await set_camera_status(self.camera, False)

    def _check_cooldown(self) -> bool:
        return time() - self.last_alert > self.alert_cooldown

    def _compute_optical_flow_magnitude(self, gray: np.ndarray) -> float:
        if self.prev_gray is None:
            self.prev_gray = gray
            return 0.0

        flow = cv2.calcOpticalFlowFarneback(
            self.prev_gray, gray, None,
            pyr_scale=0.5, levels=3, winsize=15,
            iterations=3, poly_n=5, poly_sigma=1.2, flags=0,
        )
        self.prev_gray = gray

        magnitude, _ = cv2.cartToPolar(flow[..., 0], flow[..., 1])
        mean_mag = float(np.mean(magnitude))
        return mean_mag

    def _detect_suspicious_activity(self, frame: np.ndarray, people_count: int) -> dict | None:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray_small = cv2.resize(gray, (320, 240))

        motion_mag = self._compute_optical_flow_magnitude(gray_small)
        self._motion_history.append(motion_mag)

        fg_mask = self.bg_subtractor.apply(gray_small)
        fg_pixels = cv2.countNonZero(fg_mask)
        total_pixels = fg_mask.shape[0] * fg_mask.shape[1]
        fg_ratio = fg_pixels / total_pixels if total_pixels > 0 else 0.0

        avg_motion = sum(self._motion_history) / len(self._motion_history) if self._motion_history else 0.0

        suspicious = False
        description = ""

        if people_count > 0 and motion_mag > self.motion_threshold and fg_ratio > 0.08:
            suspicious = True
            description = f"Movimento suspeito detetado (intensidade: {motion_mag:.1f})"

        elif people_count > 0 and avg_motion > self.motion_threshold * 1.5 and len(self._motion_history) >= 10:
            suspicious = True
            description = f"Movimento rápido e contínuo detetado (média: {avg_motion:.1f})"

        elif people_count > 0 and fg_ratio > 0.15:
            suspicious = True
            description = f"Grande área de movimento detetada ({fg_ratio*100:.0f}% do quadro)"

        if suspicious:
            self.suspicious_counter += 1
            if self.suspicious_counter >= self.suspicious_frames_needed and self._check_cooldown():
                self.suspicious_counter = 0
                self.last_alert = time()
                return {
                    "type": "behaviour_alert",
                    "severity": "high",
                    "description": description,
                    "motion_intensity": round(motion_mag, 2),
                    "camera_id": self.camera_id,
                    "camera_name": self.camera.name if self.camera else None,
                }
        else:
            self.suspicious_counter = max(0, self.suspicious_counter - 1)

        return None

    async def stream(self):
        try:
            while self.running:
                self.frame_index += 1
                detect = self.frame_index % self.detect_every == 0

                try:
                    frame, people_count = self.camera_service.get_frame(detect)
                except Exception:
                    break

                if detect:
                    alert = self._detect_suspicious_activity(frame, people_count)
                    if alert:
                        create_task(
                            create_notification(
                                profile_id=self.profile_id,
                                camera_id=self.camera_id,
                                title="Alerta de comportamento suspeito",
                                description=alert["description"],
                                level="C",
                                frame=frame,
                            )
                        )
                        await self.ws.send_text(json.dumps(alert))

                _, jpeg = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
                await self.ws.send_bytes(jpeg.tobytes())
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
        self.detect_every = config.get("detect_every", self.detect_every)

        try:
            if camera_id:
                self.camera_id = int(camera_id)
                self.camera = await get_user_camera(self.camera_id, self.profile_id)
                if not self.camera:
                    pass

            self.camera_service = create_camera_service(video_source, fps=self.fps, allow_draw=False)
            await set_camera_status(self.camera, True)
        except Exception:
            await set_camera_status(self.camera, False)
            await self.ws.close(code=4001)
            return

        self.running = True
        self.task = create_task(self.stream())

        try:
            await self.task
        except (CancelledError, WebSocketDisconnect):
            pass
        finally:
            await self._cleanup(reason="handle_end")
