import { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "../Button/Button";
import * as Lucide from "lucide-react";

interface PhotoCaptureProps {
  onCapture: (dataUrl: string) => void;
  onCancel?: () => void;
}
export function PhotoCapture({
  onCapture,
  onCancel,
}: PhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      if (!(err instanceof DOMException)) {
        alert("Erro desconhecido ao acessar a câmera.");
        return;
      }

      switch (err.name) {
        case "NotAllowedError":
          alert("Permissão da câmera negada.");
          break;

        case "NotFoundError":
          alert("Nenhuma câmera encontrada.");
          break;

        case "NotReadableError":
          alert("A câmera já está sendo utilizada por outro aplicativo.");
          break;

        case "AbortError":
          console.warn("Inicialização da câmera abortada.");
          break;

        default:
          console.error(err);
          alert(err.message);
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (cancelled) return;
      await startCamera();
    })();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;
    if (video.videoWidth === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    onCapture(canvas.toDataURL("image/jpeg", 0.9));

    stopCamera();
  }, [onCapture, stopCamera]);

  const replay = useCallback(async () => {
    stopCamera();
    await startCamera();
  }, [startCamera, stopCamera]);

  const handleCancel = useCallback(() => {
    stopCamera();
    if (onCancel) {
      onCancel();
    }
  }, [stopCamera, onCancel]);

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-[1000]">
      <div className="max-w-3xl w-full p-5 py-10 flex flex-col items-center gap-4">

        <canvas ref={canvasRef} className="hidden" />

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="aspect-video rounded-lg"
        />

        <div className="flex gap-2">
          <Button
            variant="danger"
            onClick={capturePhoto}
            icon={<Lucide.Camera />}
          >
            Capturar
          </Button>

          <Button
            variant="secondary"
            onClick={replay}
            icon={<Lucide.RotateCcw />}
          >
            Repetir
          </Button>


          <Button
            variant="outline"
            onClick={handleCancel}
            icon={<Lucide.X />}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}

export function usePhotoCapture() {
  const [photo, setPhoto] = useState("");
  const [showCapture, setShowCapture] = useState(false);

  const startCapture = useCallback(() => {
    setShowCapture(true);
  }, []);

  const handleCapture = useCallback((dataUrl: string) => {
    setPhoto(dataUrl);
    setShowCapture(false);
  }, []);

  const cancelCapture = useCallback(() => {
    setShowCapture(false);
  }, []);


  return {
    photo,
    setPhoto,
    showCapture,
    setShowCapture,
    startCapture,
    handleCapture,
    cancelCapture,
  };
}