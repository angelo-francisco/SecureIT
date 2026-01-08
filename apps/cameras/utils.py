import cv2


def get_cameras():
    """
    Lista câmeras disponíveis de forma compatível
    com Windows, Linux e macOS usando OpenCV puro.
    """
    cameras = []

    for index in range(5):  # tenta de 0 a 4
        cap = cv2.VideoCapture(index)
        if cap.isOpened():
            cameras.append({
                "id": index,
                "name": f"Câmera {index}"
            })
            cap.release()

    return cameras
