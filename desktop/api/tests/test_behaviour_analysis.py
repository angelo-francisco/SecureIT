from collections import deque

import numpy as np

from websocket.behaviour_analysis import (
    BehaviourAnalysisManager,
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
