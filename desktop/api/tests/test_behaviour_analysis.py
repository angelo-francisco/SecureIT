from collections import deque

import numpy as np

from services import yolo as yolo_mod
from websocket.behaviour_analysis import (
    BehaviourAnalysisManager,
    PersonTracker,
    TrackedObject,
)


def _manager():
    return BehaviourAnalysisManager(websocket=None)


def _person_bbox(x1, y1, x2, y2):
    return {"bbox": (x1, y1, x2, y2), "centroid": ((x1 + x2) // 2, (y1 + y2) // 2)}


def _tracked(class_id, class_name, positions, coupled=True, coupled_frames=5):
    obj = TrackedObject(
        0,
        class_id,
        class_name,
        (0, 0, 10, 10),
        (0, 0),
    )
    obj.positions = deque(positions, maxlen=30)
    obj.coupled = coupled
    obj.coupled_frames = coupled_frames
    return obj


def test_detect_weapon_triggered_on_overlap():
    m = _manager()
    people = [_person_bbox(10, 10, 100, 100)]
    weapons = [
        {
            "class_id": 43,
            "class_name": "faca",
            "bbox": (50, 50, 120, 120),
            "confidence": 0.9,
        }
    ]
    alert = m._detect_weapon(people, weapons)
    assert alert is not None
    assert alert["type"] == "weapon_alert"
    assert alert["severity"] == "critical"
    assert alert["weapon"]["class"] == "faca"


def test_detect_weapon_ignores_no_overlap():
    m = _manager()
    people = [_person_bbox(10, 10, 100, 100)]
    weapons = [
        {
            "class_id": 43,
            "class_name": "faca",
            "bbox": (300, 300, 400, 400),
            "confidence": 0.9,
        }
    ]
    assert m._detect_weapon(people, weapons) is None


def test_detect_robbery_armed_object():
    m = _manager()
    people = [_person_bbox(0, 0, 50, 50)]
    weapon = _tracked(43, "faca", [(0, 0), (1, 0), (2, 0), (3, 0), (4, 0)])
    alert = m._detect_robbery(people, {1: weapon}, [{"class_id": 43}])
    assert alert is not None
    assert alert["type"] == "robbery_alert"
    assert alert["armed"] is True


def test_detect_robbery_fast_coupled_object():
    m = _manager()
    people = [_person_bbox(0, 0, 50, 50)]
    obj = _tracked(
        67,
        "celular",
        [(0, 0), (100, 0), (200, 0), (300, 0), (400, 0)],
    )
    alert = m._detect_robbery(people, {1: obj}, [])
    assert alert is not None
    assert alert["type"] == "robbery_alert"
    assert alert["armed"] is False


def test_detect_robbery_ignores_static_unarmed():
    m = _manager()
    people = [_person_bbox(0, 0, 50, 50)]
    obj = _tracked(67, "celular", [(0, 0), (1, 0), (2, 0), (3, 0), (4, 0)])
    assert m._detect_robbery(people, {1: obj}, []) is None


def test_draw_overlay_draws_boxes_and_banner():
    m = _manager()
    frame = np.zeros((240, 320, 3), dtype=np.uint8)
    m._last_people = [_person_bbox(10, 10, 100, 100)]
    m._last_weapons = [
        {
            "class_id": 43,
            "class_name": "faca",
            "bbox": (50, 50, 120, 120),
            "confidence": 0.9,
        }
    ]
    m._set_banner("Possível assalto/roubo")
    m._draw_overlay(frame)
    assert np.any(frame)


def _person_xy(x, conf=0.9):
    return {
        "bbox": (x, 100, x + 40, 180),
        "centroid": (x + 20, 140),
        "confidence": conf,
    }


def test_person_tracker_keeps_stable_id():
    pt = PersonTracker()
    ids = []
    for i in range(6):
        out = pt.update([_person_xy(50 + i * 8)])
        ids.append([p["track_id"] for p in out])
    assert all(len(s) == 1 for s in ids)
    assert ids[0][0] == ids[-1][0]


def test_person_tracker_empty_frame_is_safe():
    pt = PersonTracker()
    assert pt.update([]) == []
    out = pt.update([_person_xy(10)])
    assert len(out) == 1


def test_person_tracker_keeps_id_across_gap_frame():
    pt = PersonTracker()
    a = pt.update([_person_xy(50)])
    pt.update([])
    b = pt.update([_person_xy(58)])
    assert b[0]["track_id"] == a[0]["track_id"]
    assert b[0]["confirmed"] is True


def test_person_tracker_new_detection_gets_new_id():
    pt = PersonTracker()
    a = pt.update([_person_xy(50)])
    b = pt.update([_person_xy(300)])
    assert b[0]["track_id"] != a[0]["track_id"]


def test_person_tracker_confirms_after_two_frames():
    pt = PersonTracker()
    first = pt.update([_person_xy(50)])
    second = pt.update([_person_xy(58)])
    assert first[0]["confirmed"] is False
    assert second[0]["confirmed"] is True


def test_person_tracker_speed_norm_scale_invariant():
    pt = PersonTracker()
    cases = ((1, 100, 200, 40), (2, 100, 40, 8))
    for tid, start, h, step in cases:
        pt._history[tid] = deque(
            [(start + i * step + 20, 140) for i in range(5)], maxlen=10
        )
        pt._heights[tid] = deque([h] * 5, maxlen=10)
    s1 = pt.speed_norm(1)
    s2 = pt.speed_norm(2)
    assert s1 is not None and s2 is not None
    assert abs(s1 - s2) < 1e-6


def test_detect_escape_ignores_slow_person():
    m = _manager()
    pt = m.person_tracker
    pt._history[1] = deque([(0, 0), (1, 0), (2, 0), (3, 0), (4, 0)], maxlen=10)
    pt._heights[1] = deque([100] * 5, maxlen=10)
    people = [{"track_id": 1, "confirmed": True, "bbox": (0, 0, 20, 100)}]
    assert m._detect_escape(people) is None


def test_detect_escape_fires_for_running_person():
    m = _manager()
    pt = m.person_tracker
    pt._history[1] = deque([(0, 0), (50, 0), (100, 0), (150, 0), (200, 0)], maxlen=10)
    pt._heights[1] = deque([100] * 5, maxlen=10)
    people = [{"track_id": 1, "confirmed": True, "bbox": (0, 0, 20, 100)}]
    alert = m._detect_escape(people)
    assert alert is not None
    assert alert["type"] == "robbery_alert"
    assert alert["motion_intensity"] >= 1.2


def test_detect_escape_requires_confirmed_track():
    m = _manager()
    pt = m.person_tracker
    pt._history[1] = deque([(0, 0), (50, 0), (100, 0), (150, 0), (200, 0)], maxlen=10)
    pt._heights[1] = deque([100] * 5, maxlen=10)
    people = [{"track_id": 1, "confirmed": False, "bbox": (0, 0, 20, 100)}]
    assert m._detect_escape(people) is None


def test_detect_escape_respects_cooldown():
    from time import time

    m = _manager()
    m._last_robbery_alert = time()
    pt = m.person_tracker
    pt._history[1] = deque([(0, 0), (50, 0), (100, 0), (150, 0), (200, 0)], maxlen=10)
    pt._heights[1] = deque([100] * 5, maxlen=10)
    people = [{"track_id": 1, "confirmed": True, "bbox": (0, 0, 20, 100)}]
    assert m._detect_escape(people) is None


class _FakeBox:
    def __init__(self, cls, xyxy, conf):
        self.cls = [cls]
        self.xyxy = [xyxy]
        self.conf = [conf]


class _FakeBoxes:
    def __init__(self, boxes):
        self._boxes = boxes

    def __iter__(self):
        return iter(self._boxes)


class _FakeResults:
    def __init__(self, boxes):
        self.boxes = _FakeBoxes(boxes)
        self.names = {0: "person", 24: "mochila", 43: "faca"}


def test_run_yolo_splits_classes_and_uses_imgsz(monkeypatch):
    captured = {}

    def fake_predict(frame, imgsz=320, conf=0.3):
        captured["imgsz"] = imgsz
        captured["conf"] = conf
        boxes = [
            _FakeBox(0, (1, 2, 3, 4), 0.9),
            _FakeBox(43, (5, 6, 9, 10), 0.8),
            _FakeBox(24, (11, 12, 20, 21), 0.7),
        ]
        return [_FakeResults(boxes)]

    monkeypatch.setattr(yolo_mod.YOLOService, "predict", staticmethod(fake_predict))
    m = _manager()
    m.imgsz = 640
    m.conf = 0.3
    people, objects, weapons = m._run_yolo(np.zeros((240, 320, 3), dtype=np.uint8))
    assert captured["imgsz"] == 640
    assert len(people) == 1 and people[0]["class_id"] == 0
    assert len(weapons) == 1 and weapons[0]["class_id"] == 43
    assert any(o["class_id"] == 24 for o in objects)
