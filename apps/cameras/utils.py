import cv2


def get_cameras():
    cameras = []

    for index in range(5):
        cap = cv2.VideoCapture(index)
        if cap.isOpened():
            cameras.append({
                "id": index,
                "name": f"Câmera {index}"
            })
            cap.release()

    return cameras
