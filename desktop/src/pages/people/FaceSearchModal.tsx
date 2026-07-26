import { useState, useRef, useCallback, useEffect } from "react";
import { useFaceSearch } from "../../hooks/useFaceSearch";
import { usePersonViewStore } from "../../stores";
import { usePanelNavigate } from "../../hooks/usePanelNavigate";
import { Modal, Loader } from "@/packages/ui";
import * as Lucide from "lucide-react";

interface FaceSearchModalProps {
  open: boolean;
  onClose: () => void;
}

type Mode = "select" | "camera" | "preview";

export default function FaceSearchModal({ open, onClose }: FaceSearchModalProps) {
  const [mode, setMode] = useState<Mode>("select");
  const [preview, setPreview] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const panelNavigate = usePanelNavigate();
  const faceSearch = useFaceSearch();

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!open) {
      stopCamera();
      setMode("select");
      setPreview(null);
      setCameraError(null);
      faceSearch.reset();
    }
  }, [open, stopCamera, faceSearch]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setMode("camera");
    } catch {
      setCameraError("Não foi possível aceder à câmera");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      setPreview(dataUrl);
      stopCamera();
      setMode("preview");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
      setMode("preview");
    };
    reader.readAsDataURL(file);
  };

  const handleSearch = async () => {
    if (!preview) return;
    const base64 = preview.split(",")[1];
    if (!base64) return;
    try {
      const result = await faceSearch.mutateAsync(base64);
      if (result && "id" in result) {
        usePersonViewStore.getState().setPersonId((result as any).id);
        stopCamera();
        onClose();
        panelNavigate?.("person-view");
      }
    } catch {
      // error handled by mutation
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-text">Pesquisa por Rosto</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] text-gray-400 hover:text-white transition-all"
          >
            <Lucide.X size={16} />
          </button>
        </div>

        {mode === "select" && (
          <div className="space-y-3">
            <button
              onClick={startCamera}
              className="w-full flex items-center gap-3 p-4 bg-white/[0.04] hover:bg-white/[0.08] transition-colors text-left"
            >
              <div className="w-10 h-10 bg-primary/15 flex items-center justify-center shrink-0">
                <Lucide.Camera size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-text">Usar Câmara</p>
                <p className="text-xs text-text-muted">
                  Capturar foto da câmera frontal
                </p>
              </div>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-3 p-4 bg-white/[0.04] hover:bg-white/[0.08] transition-colors text-left"
            >
              <div className="w-10 h-10 bg-primary/15 flex items-center justify-center shrink-0">
                <Lucide.Upload size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-text">Carregar Imagem</p>
                <p className="text-xs text-text-muted">
                  Selecionar ficheiro do dispositivo
                </p>
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            {cameraError && (
              <p className="text-xs text-error mt-2">{cameraError}</p>
            )}
          </div>
        )}

        {mode === "camera" && (
          <div className="space-y-4">
            <div className="relative bg-black overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full aspect-video object-cover"
              />
            </div>
            <button
              onClick={capturePhoto}
              className="w-full py-2.5 bg-primary text-white font-medium hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              <Lucide.Camera size={18} />
              Capturar
            </button>
          </div>
        )}

        {mode === "preview" && preview && (
          <div className="space-y-4">
            <div className="bg-black overflow-hidden">
              <img
                src={preview}
                alt="Rosto capturado"
                className="w-full aspect-video object-cover"
              />
            </div>
            {faceSearch.isError && (
              <p className="text-sm text-error">
                {faceSearch.error instanceof Error
                  ? faceSearch.error.message
                  : "Nenhum rosto encontrado"}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setPreview(null);
                  setMode("select");
                  faceSearch.reset();
                }}
                className="flex-1 py-2.5 text-sm font-medium text-text-muted border border-white/[0.08] hover:bg-white/[0.06] transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleSearch}
                disabled={faceSearch.isPending}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-primary hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {faceSearch.isPending ? (
                  <Loader w={16} />
                ) : (
                  <Lucide.Search size={16} />
                )}
                Pesquisar
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
