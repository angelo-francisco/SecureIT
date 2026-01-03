from threading import Event, Thread

from cv2 import VideoCapture, imencode

from time import sleep

class InternalError(Exception): ...


class Camera(object):
    def __init__(self, index: str = ""):
        if not index.isdigit():
            raise ValueError("Index inválido ou não informado")

        self.event = Event()
        self.event.set()

        self.video = VideoCapture(int(index))
        if not self.video.isOpened():
            raise InternalError("Erro ao abrir câmara")

        self.grabbed, self.frame = self.video.read()
        self.thread = Thread(target=self.update, daemon=True)
        self.thread.start()

    def stop(self):
        self.event.clear()

        if self.video.isOpened():
            print("Fechando vídeo...")
            self.video.release()

    def get_frame(self):
        image = self.frame
        _, jpeg = imencode(".jpg", image)
        return jpeg.tobytes()

    def update(self):
        while self.event.is_set():
            grabbed, frame = self.video.read()
            if not grabbed:
                break
            self.frame = frame
            sleep(1/30) # tmp: 30 fps


def gen_video(camera: Camera):
    try:
        while True:
            try:
                frame = camera.get_frame()
            except Exception as error:
                raise InternalError(f"Erro inesperado ao pegar frame: {error} ")
            yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + frame + b"\r\n\r\n")
    except Exception as error:
        print("Cliente desconectou: " + error)
    finally:
        camera.stop()
