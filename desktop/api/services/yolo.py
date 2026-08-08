import threading

import torch
from ultralytics.models import YOLO
from ultralytics.utils import LOGGER

from core.config import settings

LOGGER.setLevel("ERROR")

INFERENCE_LOCK = threading.Lock()


class YOLOService:
    _model = None

    @classmethod
    def get_model(cls):
        if cls._model is None:
            yolo_model_path = settings.YOLO_PATH
            device = "cuda" if torch.cuda.is_available() else "cpu"

            cls._model = YOLO(yolo_model_path)
            cls._model.to(device)
        return cls._model

    @classmethod
    def predict(cls, frame, imgsz=320, conf=0.3):
        model = cls.get_model()
        with INFERENCE_LOCK:
            return model(frame, imgsz=imgsz, conf=conf)
