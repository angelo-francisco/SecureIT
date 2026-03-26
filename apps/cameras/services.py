from ultralytics import YOLO # type: ignore
import torch

class YOLOService:
    _instance = None
    _model = None

    @classmethod
    def get_model(cls):
        if cls._model is None:
            # Load model only once
            cls._model = YOLO("yolo11n.pt")
            device = "cuda" if torch.cuda.is_available() else "cpu"
            cls._model.to(device)
            print(f"YOLO model loaded on {device}")
        return cls._model

    @classmethod
    def predict(cls, frame, imgsz=320, conf=0.3):
        model = cls.get_model()
        return model(frame, imgsz=imgsz, conf=conf)
