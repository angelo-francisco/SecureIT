import { useEffect, useRef, useState, useCallback } from "react";
import { useCameras } from "../../hooks";
import { connectCamera, disconnectCamera } from "../../lib/websocket";
import * as Lucide from "lucide-react";

interface CameraMonitorProps {
  onClose?: () => void;
}

interface FaceData {
  bbox: [number, number, number, number];
  person_id: number | null;
  name: string | null;
  unknown: boolean;
  confidence: number;
}

interface CameraState {
  connected: boolean;
  faces: FaceData[];
  error?: string;
}

export default function CameraMonitor({ onClose }: CameraMonitorProps) {
  const { data: cameras } = useCameras();
  const imageRefs = useRef<Map<string, HTMLImageElement>>(new Map());
  const [camStates, setCamStates] = useState<Record<string, CameraState>>({});
  const [selectedCamera, setSelectedCamera] = useState<number | null>(null);
  const wsKeysRef = useRef<string[]>([]);

  const updateCamState = useCallback((id: number | string, patch: Partial<CameraState>) => {
    setCamStates((prev) => ({
      ...prev,
      [String(id)]: { ...prev[String(id)], ...patch },
    }));
  }, []);

  const cameraIds = cameras?.map((c) => `${c.id}:${c.task}`).sort().join(",") || "";

  const consumerFor = (task: string) =>
    task === "FR" ? "face-recognition" : task === "BA" ? "behaviour-analysis" : "area-detection";

  useEffect(() => {
    if (!cameras || !Array.isArray(cameras)) return;

    const wantedKeys = new Set(
      cameras.filter((c) => c.video_source).map((c) => `${consumerFor(c.task)}-${c.id}`)
    );

    wsKeysRef.current = wsKeysRef.current.filter((key) => {
      if (!wantedKeys.has(key)) {
        disconnectCamera(key);
        return false;
      }
      return true;
    });

    cameras.forEach((cam) => {
      if (!cam.video_source) return;
      const key = `${consumerFor(cam.task)}-${cam.id}`;
      if (wsKeysRef.current.includes(key)) return;

      connectCamera(
        cam.id,
        cam.video_source,
        consumerFor(cam.task),
        (blob) => {
          const img = imageRefs.current.get(`cam-${cam.id}`);
          if (img) {
            const url = URL.createObjectURL(blob);
            img.src = url;
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }
        },
        (data) => {
          if (data.type === "faces") {
            updateCamState(cam.id, { faces: (data as { faces: FaceData[] }).faces ?? [] });
          }
        },
        () => {
          updateCamState(cam.id, { connected: false, error: "Desconectado" });
        }
      );
      wsKeysRef.current = [...wsKeysRef.current, key];
      updateCamState(cam.id, { connected: true, faces: [] });
    });
  }, [cameraIds, updateCamState]);

  useEffect(() => {
    return () => {
      wsKeysRef.current.forEach(disconnectCamera);
      wsKeysRef.current = [];
    };
  }, []);

  const selectedCam = cameras?.find((c) => c.id === selectedCamera);
  const regularCams = cameras?.filter((c) => c.task !== "FR") ?? [];
  const faceCams = cameras?.filter((c) => c.task === "FR") ?? [];

  if (selectedCamera && selectedCam) {
    const state = camStates[String(selectedCam.id)];
    return (
      <div className="flex-1 h-full flex flex-col relative overflow-hidden">
        <header className="flex items-center justify-between shrink-0 px-6 py-4">
          <button
            onClick={() => setSelectedCamera(null)}
            className="flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors"
          >
            <Lucide.ArrowLeft size={16} />
            Voltar ao grid
          </button>
          <h2 className="text-lg font-bold text-text">{selectedCam.name}</h2>
          <div />
        </header>

        <div className="flex-1 flex items-center justify-center p-6 pt-0">
          <div className="relative w-full max-w-4xl aspect-video overflow-hidden border border-border bg-black">
            <img
              ref={(el) => { if (el) imageRefs.current.set(`cam-${selectedCam.id}`, el); }}
              className="w-full h-full object-contain"
              alt={selectedCam.name}
            />
            {state?.faces?.map((f, i) => (
              <div
                key={i}
                className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-2 border border-white/10"
              >
                {f.unknown ? (
                  <span className="text-red-400 font-medium">Indivíduo Desconhecido</span>
                ) : (
                  <div className="flex flex-col">
                    <span className="text-green-400 font-medium">{f.name}</span>
                    <span className="text-text-muted">Confiança: {(f.confidence * 100).toFixed(0)}%</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden">
      <header className="flex items-center justify-between shrink-0 px-6 py-4">
        <div className="flex items-center gap-3">
          <Lucide.Monitor size={20} className="text-primary" />
          <h2 className="text-lg font-bold text-text">Monitoramento</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 bg-white/[0.06] hover:bg-white/[0.12] text-gray-400 hover:text-white transition-all duration-150"
          >
            <Lucide.X size={16} strokeWidth={2} />
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {/* Regular cameras grid */}
        {regularCams.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-text-muted mb-3">Câmaras</h3>
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
              {regularCams.map((cam) => (
                <CameraTile
                  key={cam.id}
                  cam={cam}
                  state={camStates[String(cam.id)]}
                  imageRefs={imageRefs}
                  onClick={() => setSelectedCamera(cam.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Face recognition cameras */}
        {faceCams.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-text-muted mb-3">Reconhecimento Facial</h3>
            <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
              {faceCams.map((cam) => (
                <FaceTile
                  key={cam.id}
                  cam={cam}
                  state={camStates[String(cam.id)]}
                  imageRefs={imageRefs}
                  onClick={() => setSelectedCamera(cam.id)}
                />
              ))}
            </div>
          </div>
        )}

        {(!cameras || cameras.length === 0) && (
          <div className="w-full flex justify-center items-center flex-col text-center gap-3 mt-16">
            <div className="w-14 h-14 bg-white/[0.04] flex items-center justify-center">
              <Lucide.VideoOff size={28} className="text-text-muted" />
            </div>
            <div className="flex flex-col gap-1 max-w-md">
              <h3 className="text-text font-semibold text-base">Nenhuma câmara registada</h3>
              <p className="text-text-muted text-sm">Registe câmaras para começar o monitoramento</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tile for regular cameras ────────────────────────────────

function CameraTile({
  cam, state, imageRefs, onClick,
}: {
  cam: { id: number; name: string; video_source: string | number | null; task: string };
  state?: CameraState;
  imageRefs: React.MutableRefObject<Map<string, HTMLImageElement>>;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative aspect-video overflow-hidden border border-border bg-black group hover:border-primary/50 transition-colors text-left"
    >
      <img
        ref={(el) => { if (el) imageRefs.current.set(`cam-${cam.id}`, el); }}
        className="w-full h-full object-contain"
        alt={cam.name}
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white">{cam.name}</span>
          <span className={`flex items-center gap-1 text-xs ${state?.connected ? "text-green-400" : "text-red-400"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${state?.connected ? "bg-green-400" : "bg-red-400"}`} />
            {state?.connected ? "Online" : state?.error || "Offline"}
          </span>
        </div>
      </div>
      {state?.faces && state.faces.length > 0 && (
        <div className="absolute top-2 right-2 flex -space-x-1">
          {state.faces.map((f, i) => (
            <div
              key={i}
              className={`w-5 h-5 rounded-full border-2 border-black flex items-center justify-center text-[9px] font-bold ${
                f.unknown ? "bg-red-500 text-white" : "bg-green-500 text-white"
              }`}
              title={f.name || "Desconhecido"}
            >
              {f.unknown ? "?" : "✓"}
            </div>
          ))}
        </div>
      )}
    </button>
  );
}

// ── Compact tile for face-recognition cameras ───────────────

function FaceTile({
  cam, state, imageRefs, onClick,
}: {
  cam: { id: number; name: string; video_source: string | number | null; task: string };
  state?: CameraState;
  imageRefs: React.MutableRefObject<Map<string, HTMLImageElement>>;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative aspect-[4/3] overflow-hidden border border-border bg-black group hover:border-cyan-500/50 transition-colors text-left"
    >
      <img
        ref={(el) => { if (el) imageRefs.current.set(`cam-${cam.id}`, el); }}
        className="w-full h-full object-contain"
        alt={cam.name}
      />

      {/* Overlay com info de rostos */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent">
        {state?.faces && state.faces.length > 0 ? (
          <div className="absolute bottom-0 inset-x-0 p-2 space-y-1">
            {state.faces.map((f, i) => (
              <div
                key={i}
                className={`text-[10px] leading-tight px-1.5 py-0.5 ${
                  f.unknown
                    ? "bg-red-500/80 text-white"
                    : "bg-green-500/80 text-white"
                }`}
              >
                {f.unknown ? "?" : f.name}
              </div>
            ))}
          </div>
        ) : (
          <div className="absolute bottom-2 left-2 text-[10px] text-text-muted">
            {state?.connected ? "A aguardar..." : "Offline"}
          </div>
        )}
      </div>

      <div className="absolute top-1.5 left-1.5">
        <span className="text-[10px] font-medium text-cyan-400 bg-black/60 px-1.5 py-0.5">
          FR
        </span>
      </div>
    </button>
  );
}
