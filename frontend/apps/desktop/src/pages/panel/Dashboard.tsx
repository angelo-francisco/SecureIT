import { useEffect, useRef, useState, type ComponentType } from "react";
import { FloatingNavbar } from "../../components/FloatingNavbar";
import type { ViewId } from "../../components/FloatingNavbar";
import { PanelSheet, Loader } from "../../ui";
import { PanelNavContext } from "../../hooks/usePanelNavigate";
import { connectCamera, disconnectCamera } from "../../lib/websocket";
import { useCameras } from "../../hooks";
import * as Lucide from "lucide-react";
import CameraList from "../cameras/CameraList";
import CameraNew from "../cameras/CameraNew";
import CameraView from "../cameras/CameraView";
import CameraMonitor from "./CameraMonitor";
import PeopleList from "../people/PeopleList";
import PersonNew from "../people/PersonNew";
import PersonView from "../people/PersonView";
import RoleManagement from "../people/RoleManagement";
import NotificationList from "../notifications/NotificationList";
import Settings from "./Settings";

interface ViewConfigEntry {
  title: string;
  icon: React.ReactNode;
  component: ComponentType<{ onClose?: () => void }>;
}

const viewConfig: Partial<Record<ViewId, ViewConfigEntry>> = {
  cameras: { title: "Câmeras", icon: <Lucide.Video size={20} />, component: CameraList },
  "camera-new": { title: "Nova Câmera", icon: <Lucide.Plus size={20} />, component: CameraNew },
  "camera-view": { title: "Detalhes da Câmera", icon: <Lucide.Video size={20} />, component: CameraView },
  "camera-monitor": { title: "Monitoramento", icon: <Lucide.Monitor size={20} />, component: CameraMonitor },
  people: { title: "Pessoas", icon: <Lucide.Users size={20} />, component: PeopleList },
  "person-new": { title: "Nova Pessoa", icon: <Lucide.UserPlus size={20} />, component: PersonNew },
  "person-view": { title: "Detalhes da Pessoa", icon: <Lucide.User size={20} />, component: PersonView },
  "role-management": { title: "Gerenciar Cargos", icon: <Lucide.FolderTree size={20} />, component: RoleManagement },
  notifications: { title: "Notificações", icon: <Lucide.Bell size={20} />, component: NotificationList },
  settings: { title: "Configurações", icon: <Lucide.Settings size={20} />, component: Settings },
};

export default function Dashboard() {
  const [activeView, setActiveView] = useState<ViewId | null>(null);
  const imageRefs = useRef<Map<string, HTMLImageElement>>(new Map());
  const { data: cameras, isLoading } = useCameras();
  const [connectingCameras, setConnectingCameras] = useState<Set<number>>(new Set());
  const wsKeysRef = useRef<string[]>([]);
  const cameraIdsRef = useRef<string>("");

  useEffect(() => {
    const ids = cameras?.map((c) => c.id).sort().join(",") || "";
    if (cameraIdsRef.current === ids && wsKeysRef.current.length > 0) return;
    cameraIdsRef.current = ids;

    wsKeysRef.current.forEach(disconnectCamera);
    wsKeysRef.current = [];

    if (!cameras || cameras.length === 0) return;

    const keys: string[] = [];

    cameras.forEach((camera) => {
      if (!camera.video_source) return;

      const key = connectCamera(
        camera.id,
        camera.video_source,
        camera.face_recognition ? "face-recognition" : "area-detection",
        (blob) => {
          const img = imageRefs.current.get(`cam-${camera.id}`);
          if (img) {
            const url = URL.createObjectURL(blob);
            img.src = url;
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }
          setConnectingCameras((prev) => {
            const next = new Set(prev);
            next.delete(camera.id);
            return next;
          });
        },
        undefined,
        undefined,
        `dash-${camera.id}`,
      );
      keys.push(key);
    });

    wsKeysRef.current = keys;

    setConnectingCameras(
      new Set(cameras.filter((c) => c.video_source).map((c) => c.id))
    );

    return () => {
      wsKeysRef.current.forEach(disconnectCamera);
      wsKeysRef.current = [];
    };
  }, [cameras]);

  const close = () => setActiveView(null);

  const viewEntry = activeView ? viewConfig[activeView] : undefined;
  const ViewComponent = viewEntry?.component;

  if (isLoading) {
    return (
      <div className="w-full h-[100vh] flex flex-col items-center justify-center bg-black gap-4">
        <Loader w={48} />
        <span className="text-lg text-white/60">A carregar câmeras...</span>
      </div>
    );
  }

  return (
    <>
      <audio id="soundEffect" src="/static/sounds/notify.mp3" preload="auto" />

      <div className={`w-full min-h-screen bg-black relative z-10 transition-all duration-500 ${activeView ? "brightness-[0.3]" : ""}`}>
        {!cameras || cameras.length === 0 ? (
          <div className="w-full h-[100vh] flex flex-col items-center justify-center bg-black">
            <Lucide.VideoOff size={60} className="text-white" />
            <span className="text-xl text-white mt-4">
              Sem câmeras registadas
            </span>
          </div>
        ) : (
          <main
            className="w-full h-[100vh] bg-black grid"
            style={{
              gridTemplateColumns: `repeat(${Math.min(cameras.length, 3)}, 1fr)`,
              gridTemplateRows: `repeat(${Math.ceil(cameras.length / 3)}, 1fr)`,
            }}
          >
            {cameras.map((camera) => (
              <div
                key={camera.id}
                className="border border-gray-600 relative bg-black w-full h-full overflow-hidden"
              >
                <div className="w-full h-full flex items-center justify-center">
                  <img
                    ref={(el) => {
                      if (el) imageRefs.current.set(`cam-${camera.id}`, el);
                    }}
                    className="relative w-full h-full object-contain bg-black"
                    alt={camera.name}
                  />
                  {connectingCameras.has(camera.id) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                      <Loader w={36} />
                    </div>
                  )}
                  <span className="px-2 absolute bottom-1 right-1 text-lg text-green-400 font-mono">
                    {camera.name}
                  </span>
                </div>
              </div>
            ))}
          </main>
        )}
      </div>

      <FloatingNavbar
        activeView={activeView}
        onSelect={(view) =>
          setActiveView((prev) => (prev === view ? null : view))
        }
      />

      <PanelNavContext.Provider
        value={(view) => setActiveView(view as ViewId)}
      >
        <PanelSheet open={activeView !== null} onClose={close}>
          {ViewComponent && <ViewComponent onClose={close} />}
        </PanelSheet>
      </PanelNavContext.Provider>
    </>
  );
}
