import { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "../Button/Button";
import * as Lucide from "lucide-react";

interface PhotoCaptureProps {
  onCapture: (dataUrl: string) => void;
  onSearch?: () => void;
  search?: boolean;
}

export function PhotoCapture({ onCapture, onSearch, search }: PhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    async function init() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          alert("O navegador não suporta acesso à câmera.");
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err: unknown) {
        const msg =
          (err as { name?: string })?.name === "NotAllowedError"
            ? "Permissão da câmera negada. Aceite as permissões nas configurações do navegador."
            : (err as { name?: string })?.name === "NotFoundError"
            ? "Nenhuma câmara encontrada no dispositivo."
            : "Não foi possível acessar a câmera. Verifique as permissões.";
        alert(msg);
      }
    }
    init();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video?.videoWidth || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    onCapture(canvas.toDataURL("image/jpeg", 0.85));
    video.pause();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, [onCapture]);

  const replay = useCallback(() => {
    videoRef.current?.play();
  }, []);

  return (
    <div className="fixed inset-0 flex justify-center items-center backdrop-blur-sm z-[1000]">
      <div className="max-w-3xl p-5 py-10 rounded-xl space-y-4 w-full flex flex-col justify-center items-center gap-3">
        <canvas ref={canvasRef} className="hidden rounded-lg" />
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="aspect-video rounded-lg"
        />
        <div className="flex gap-2">
          <Button variant="danger" onClick={capturePhoto} icon={<Lucide.Camera />}>
            Capturar
          </Button>
          <Button variant="secondary" onClick={replay} icon={<Lucide.RotateCcw />}>
            Repetir
          </Button>
          {search && (
            <Button variant="ghost" onClick={onSearch} icon={<Lucide.Search />}>
              Pesquisar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function usePhotoCapture() {
  const [photo, setPhoto] = useState<string>("");
  const [showCapture, setShowCapture] = useState(false);

  const startCapture = useCallback(() => setShowCapture(true), []);

  const handleCapture = useCallback((dataUrl: string) => {
    setPhoto(dataUrl);
    setShowCapture(false);
  }, []);

  return { photo, setPhoto, showCapture, startCapture, handleCapture };
}
