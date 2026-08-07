import asyncio
import json
import logging
from asyncio import CancelledError, create_task, sleep as async_sleep
from collections import deque
from time import time

import cv2
import numpy as np
from fastapi import WebSocket, WebSocketDisconnect

from websocket.helpers import (
    authenticate,
    check_license_feature,
    create_camera_service,
    create_notification,
    get_user_camera,
    load_user_config,
    set_camera_status,
    websocket_watchdog,
)
from websocket.registry import register_manager, unregister_manager

logger = logging.getLogger(__name__)

THEFT_CLASS_IDS = {
    24: "mochila",
    26: "guarda-chuva",
    27: "bolsa",
    28: "gravata",
    29: "mala",
    31: "skis",
    32: "snowboard",
    33: "bola",
    34: "pipa",
    35: "taco basebol",
    36: "luva basebol",
    37: "skate",
    38: "prancha surf",
    39: "garrafa",
    40: "copo vinho",
    41: "copo",
    42: "garfo",
    43: "faca",
    44: "colher",
    45: "tigela",
    46: "banana",
    47: "maçã",
    48: "sanduíche",
    49: "laranja",
    50: "brócolis",
    51: "cenoura",
    52: "cachorro-quente",
    53: "pizza",
    54: "donut",
    55: "bolo",
    63: "laptop",
    64: "rato",
    65: "comando",
    66: "teclado",
    67: "celular",
    68: "microondas",
    69: "forno",
    70: "torradeira",
    71: "lava-loiça",
    72: "frigorífico",
    73: "livro",
    74: "relógio",
    75: "vaso",
    76: "tesoura",
    77: "ursinho",
    78: "secador",
    79: "escova dentes",
}

WEAPON_CLASS_IDS = {
    43: "faca",
    76: "tesoura",
}


def _bbox_center(bbox):
    x1, y1, x2, y2 = bbox
    return (x1 + x2) // 2, (y1 + y2) // 2


def _bbox_area(bbox):
    x1, y1, x2, y2 = bbox
    return max(0, x2 - x1) * max(0, y2 - y1)


def _bbox_overlap(box_a, box_b):
    x1 = max(box_a[0], box_b[0])
    y1 = max(box_a[1], box_b[1])
    x2 = min(box_a[2], box_b[2])
    y2 = min(box_a[3], box_b[3])
    if x2 <= x1 or y2 <= y1:
        return 0.0
    inter = (x2 - x1) * (y2 - y1)
    area_a = _bbox_area(box_a)
    area_b = _bbox_area(box_b)
    return inter / min(area_a, area_b) if min(area_a, area_b) > 0 else 0.0


def _centroid_dist(a, b):
    return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) ** 0.5


class TrackedObject:
    __slots__ = (
        "id",
        "class_id",
        "class_name",
        "bbox",
        "centroid",
        "positions",
        "missed_frames",
        "first_seen",
        "last_seen",
        "stationary",
        "stationary_frames",
        "coupled",
        "coupled_frames",
    )

    def __init__(self, obj_id, class_id, class_name, bbox, centroid):
        self.id = obj_id
        self.class_id = class_id
        self.class_name = class_name
        self.bbox = bbox
        self.centroid = centroid
        self.positions = deque(maxlen=30)
        self.positions.append(centroid)
        self.missed_frames = 0
        self.first_seen = time()
        self.last_seen = time()
        self.stationary = True
        self.stationary_frames = 0
        self.coupled = False
        self.coupled_frames = 0

    def update(self, bbox, centroid):
        self.bbox = bbox
        self.centroid = centroid
        self.positions.append(centroid)
        self.missed_frames = 0
        self.last_seen = time()

        if len(self.positions) >= 5:
            recent = list(self.positions)[-5:]
            total_dist = sum(
                _centroid_dist(recent[i], recent[i - 1]) for i in range(1, len(recent))
            )
            if total_dist < 20:
                self.stationary_frames += 1
            else:
                self.stationary_frames = 0
            self.stationary = self.stationary_frames > 3


class ObjectTracker:
    def __init__(self, max_dist=80):
        self.objects: dict[int, TrackedObject] = {}
        self.next_id = 0
        self.max_dist = max_dist

    def update(self, detections):
        matched = set()
        for det in detections:
            cent = (int(det["centroid"][0]), int(det["centroid"][1]))
            best_id = None
            best_dist = self.max_dist
            for oid, obj in self.objects.items():
                if oid in matched:
                    continue
                if obj.class_id != det["class_id"]:
                    continue
                dist = _centroid_dist(obj.centroid, cent)
                if dist < best_dist:
                    best_dist = dist
                    best_id = oid

            if best_id is not None:
                obj = self.objects[best_id]
                obj.update(det["bbox"], cent)
                matched.add(best_id)
            else:
                obj = TrackedObject(
                    self.next_id,
                    det["class_id"],
                    det["class_name"],
                    det["bbox"],
                    cent,
                )
                self.objects[self.next_id] = obj
                self.next_id += 1
                matched.add(obj.id)

        for oid, obj in self.objects.items():
            if oid not in matched:
                obj.missed_frames += 1

    def get_active(self, max_missed=5):
        return {
            oid: obj
            for oid, obj in self.objects.items()
            if obj.missed_frames <= max_missed
        }

    def get_disappeared(self, max_missed=5, min_missed=3):
        return {
            oid: obj
            for oid, obj in self.objects.items()
            if min_missed <= obj.missed_frames <= max_missed
        }

    def clean(self, max_age=300):
        now = time()
        self.objects = {
            oid: obj
            for oid, obj in self.objects.items()
            if now - obj.last_seen < max_age
        }


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
            history=500,
            varThreshold=50,
            detectShadows=False,
        )
        self._motion_history: deque = deque(maxlen=30)
        self._object_tracker = ObjectTracker()
        self._last_theft_alert = 0.0
        self._theft_cooldown = 15.0
        self._last_weapon_alert = 0.0
        self._weapon_cooldown = 15.0
        self._last_robbery_alert = 0.0
        self._robbery_cooldown = 15.0
        self._last_people: list = []
        self._last_objects: list = []
        self._last_weapons: list = []
        self._active_banner: dict | None = None
        self.allow_draw = True
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

    def _check_cooldown(self) -> bool:
        return time() - self.last_alert > self.alert_cooldown

    def _theft_cooldown_ok(self) -> bool:
        return time() - self._last_theft_alert > self._theft_cooldown

    def _weapon_cooldown_ok(self) -> bool:
        return time() - self._last_weapon_alert > self._weapon_cooldown

    def _robbery_cooldown_ok(self) -> bool:
        return time() - self._last_robbery_alert > self._robbery_cooldown

    def _set_banner(self, text: str, color=(0, 0, 255), duration: float = 4.0):
        self._active_banner = {
            "text": text,
            "color": color,
            "until": time() + duration,
        }

    def _compute_optical_flow_magnitude(self, gray: np.ndarray) -> float:
        if self.prev_gray is None:
            self.prev_gray = gray
            return 0.0

        flow = cv2.calcOpticalFlowFarneback(
            self.prev_gray,
            gray,
            None,
            pyr_scale=0.5,
            levels=3,
            winsize=15,
            iterations=3,
            poly_n=5,
            poly_sigma=1.2,
            flags=0,
        )
        self.prev_gray = gray

        magnitude, _ = cv2.cartToPolar(flow[..., 0], flow[..., 1])
        return float(np.mean(magnitude))

    def _detect_theft(
        self, people: list, disappeared: dict
    ) -> dict | None:
        if not self._theft_cooldown_ok():
            return None
        if not people:
            return None

        for obj in list(disappeared.values()):
            if obj.missed_frames < 3 or obj.missed_frames > 15:
                continue
            if not obj.stationary or time() - obj.first_seen < 2.0:
                continue

            pc = people[0]["centroid"]
            if _centroid_dist(pc, obj.centroid) > 200:
                continue

            self._last_theft_alert = time()
            return {
                "type": "theft_alert",
                "severity": "critical",
                "description": f"Possível furto: {obj.class_name} removido",
                "object": {"class": obj.class_name, "class_id": obj.class_id},
                "motion_intensity": round(
                    sum(self._motion_history) / len(self._motion_history),
                    2,
                )
                if self._motion_history
                else 0,
                "camera_id": self.camera_id,
                "camera_name": self.camera.name if self.camera else None,
            }

        return None

    def _detect_weapon(self, people: list, weapons: list) -> dict | None:
        if not self._weapon_cooldown_ok():
            return None
        if not people or not weapons:
            return None

        for person in people:
            pb = person["bbox"]
            for w in weapons:
                if _bbox_overlap(pb, w["bbox"]) > 0.15:
                    self._last_weapon_alert = time()
                    return {
                        "type": "weapon_alert",
                        "severity": "critical",
                        "description": (
                            f"Pessoa com arma branca detetada: {w['class_name']}"
                        ),
                        "weapon": {
                            "class": w["class_name"],
                            "class_id": w["class_id"],
                            "confidence": w["confidence"],
                        },
                        "camera_id": self.camera_id,
                        "camera_name": self.camera.name if self.camera else None,
                    }

        return None

    def _detect_robbery(
        self, people: list, active: dict, weapons: list
    ) -> dict | None:
        if not self._robbery_cooldown_ok():
            return None
        if not people:
            return None

        weapon_ids = {w["class_id"] for w in weapons}

        for obj in active.values():
            if not obj.coupled or obj.coupled_frames < 3:
                continue
            if len(obj.positions) < 5:
                continue

            recent = list(obj.positions)[-5:]
            speed = sum(
                _centroid_dist(recent[i], recent[i - 1]) for i in range(1, len(recent))
            )

            armed = obj.class_id in weapon_ids
            if not armed and speed <= 50:
                continue

            self._last_robbery_alert = time()
            return {
                "type": "robbery_alert",
                "severity": "critical",
                "description": (
                    f"Possível assalto/roubo: pessoa em fuga com "
                    f"{'arma' if armed else 'objeto'} ({obj.class_name})"
                ),
                "object": {"class": obj.class_name, "class_id": obj.class_id},
                "armed": armed,
                "motion_intensity": round(speed, 2),
                "camera_id": self.camera_id,
                "camera_name": self.camera.name if self.camera else None,
            }

        return None

    def _detect_suspicious_activity(
        self, frame: np.ndarray, people_count: int
    ) -> dict | None:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray_small = cv2.resize(gray, (320, 240))

        motion_mag = self._compute_optical_flow_magnitude(gray_small)
        self._motion_history.append(motion_mag)

        fg_mask = self.bg_subtractor.apply(gray_small)
        fg_pixels = cv2.countNonZero(fg_mask)
        total_pixels = fg_mask.shape[0] * fg_mask.shape[1]
        fg_ratio = fg_pixels / total_pixels if total_pixels > 0 else 0.0

        avg_motion = (
            sum(self._motion_history) / len(self._motion_history)
            if self._motion_history
            else 0.0
        )

        suspicious = False
        description = ""

        if people_count > 0 and motion_mag > self.motion_threshold and fg_ratio > 0.08:
            suspicious = True
            description = f"Movimento suspeito detetado (intensidade: {motion_mag:.1f})"

        elif (
            people_count > 0
            and avg_motion > self.motion_threshold * 1.5
            and len(self._motion_history) >= 10
        ):
            suspicious = True
            description = (
                f"Movimento rápido e contínuo detetado (média: {avg_motion:.1f})"
            )

        elif people_count > 0 and fg_ratio > 0.15:
            suspicious = True
            description = (
                f"Grande área de movimento detetada ({fg_ratio * 100:.0f}% do quadro)"
            )

        if suspicious:
            self.suspicious_counter += 1
            if (
                self.suspicious_counter >= self.suspicious_frames_needed
                and self._check_cooldown()
            ):
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

    def _draw_overlay(self, frame: np.ndarray) -> None:
        for p in self._last_people:
            x1, y1, x2, y2 = p["bbox"]
            cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 0), 2)
            cv2.putText(
                frame,
                "Pessoa",
                (x1, y1 - 5),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (255, 0, 0),
                2,
            )

        for o in self._last_objects:
            x1, y1, x2, y2 = o["bbox"]
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 165, 255), 2)
            cv2.putText(
                frame,
                o["class_name"],
                (x1, y1 - 5),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 165, 255),
                2,
            )

        for w in self._last_weapons:
            x1, y1, x2, y2 = w["bbox"]
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 3)
            cv2.putText(
                frame,
                f"ARMA: {w['class_name']}",
                (x1, y1 - 5),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 0, 255),
                2,
            )

        if self._active_banner and time() < self._active_banner["until"]:
            text = self._active_banner["text"]
            color = self._active_banner["color"]
            width = frame.shape[1]
            cv2.rectangle(frame, (0, 0), (width, 40), (0, 0, 0), -1)
            cv2.putText(
                frame,
                text,
                (10, 27),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                color,
                2,
            )
        else:
            self._active_banner = None

    def _run_yolo(self, frame: np.ndarray) -> tuple[list, list, list, int]:
        from services.yolo import YOLOService  # lazy import

        results = YOLOService.predict(frame, imgsz=320, conf=0.3)
        boxes = results[0].boxes
        names = results[0].names

        people = []
        objects = []
        weapons = []
        for b in boxes:
            cls_id = int(b.cls[0])
            bbox = tuple(map(int, b.xyxy[0]))
            cent = _bbox_center(bbox)
            entry = {
                "class_id": cls_id,
                "class_name": names[cls_id],
                "bbox": bbox,
                "centroid": cent,
                "confidence": float(b.conf[0]),
            }
            if cls_id == 0:
                people.append(entry)
            elif cls_id in WEAPON_CLASS_IDS:
                weapons.append(entry)
                objects.append(entry)
            elif cls_id in THEFT_CLASS_IDS:
                objects.append(entry)

        return people, objects, weapons, len(people)

    async def stream(self):
        try:
            while self.running:
                self.frame_index += 1
                detect = self.frame_index % self.detect_every == 0

                raw_frame = self.camera_service.frame
                if raw_frame is None:
                    self.frame_errors += 1
                    logger.warning(
                        "no frame for camera %s (%d/%d)",
                        self.camera_id,
                        self.frame_errors,
                        10,
                    )
                    if self.frame_errors >= 10:
                        break
                    await async_sleep(1 / self.fps)
                    continue
                self.frame_errors = 0

                people_count = 0
                if detect:
                    people, objects, weapons, people_count = self._run_yolo(raw_frame)
                    self._last_people = people
                    self._last_objects = objects
                    self._last_weapons = weapons

                    self._object_tracker.update(objects)
                    active = self._object_tracker.get_active()
                    disappeared = self._object_tracker.get_disappeared()
                    self._object_tracker.clean()

                    for person in people:
                        pb = person["bbox"]
                        for obj in active.values():
                            if _bbox_overlap(pb, obj.bbox) > 0.15:
                                obj.coupled = True
                                obj.coupled_frames += 1
                            elif obj.coupled:
                                obj.coupled_frames -= 1
                                if obj.coupled_frames <= 0:
                                    obj.coupled = False
                                    obj.coupled_frames = 0

                    alert = self._detect_suspicious_activity(raw_frame, people_count)
                    if alert:
                        self._set_banner(alert["description"])
                        create_task(
                            create_notification(
                                profile_id=self.profile_id,
                                camera_id=self.camera_id,
                                title="Alerta de comportamento suspeito",
                                description=alert["description"],
                                level="C",
                                frame=raw_frame,
                            )
                        )
                        await self.ws.send_text(json.dumps(alert))

                    weapon = self._detect_weapon(people, weapons)
                    if weapon:
                        self._set_banner(weapon["description"])
                        create_task(
                            create_notification(
                                profile_id=self.profile_id,
                                camera_id=self.camera_id,
                                title="Alerta de arma detetada",
                                description=weapon["description"],
                                level="C",
                                frame=raw_frame,
                            )
                        )
                        await self.ws.send_text(json.dumps(weapon))

                    theft = self._detect_theft(people, disappeared)
                    if theft:
                        self._set_banner(theft["description"])
                        create_task(
                            create_notification(
                                profile_id=self.profile_id,
                                camera_id=self.camera_id,
                                title="Alerta de possível furto",
                                description=theft["description"],
                                level="C",
                                frame=raw_frame,
                            )
                        )
                        await self.ws.send_text(json.dumps(theft))

                    robbery = self._detect_robbery(people, active, weapons)
                    if robbery:
                        self._set_banner(robbery["description"])
                        create_task(
                            create_notification(
                                profile_id=self.profile_id,
                                camera_id=self.camera_id,
                                title="Alerta de possível assalto/roubo",
                                description=robbery["description"],
                                level="C",
                                frame=raw_frame,
                            )
                        )
                        await self.ws.send_text(json.dumps(robbery))

                if self.allow_draw:
                    self._draw_overlay(raw_frame)

                _, jpeg = cv2.imencode(
                    ".jpg", raw_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 70]
                )
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

        if not await check_license_feature(self.profile_id, "analise_comportamental"):
            await self.ws.close(
                code=4001, reason="Licença não inclui Análise de Comportamento"
            )
            return

        await self.ws.accept()

        config = await load_user_config(self.profile_id)
        self.fps = config.get("fps", self.fps)
        self.detect_every = config.get("detect_every", self.detect_every)
        self.allow_draw = config.get("allow_draw", self.allow_draw)

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
