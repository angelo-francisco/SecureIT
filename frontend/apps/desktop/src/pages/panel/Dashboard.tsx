import { useEffect, useRef, useState, type ComponentType } from "react";
import { FloatingNavbar } from "../../components/FloatingNavbar";
import type { ViewId } from "../../components/FloatingNavbar";
import { PanelSheet } from "../../ui";
import { PanelNavContext } from "../../hooks/usePanelNavigate";
import { connectCamera, disconnectCamera } from "../../lib/websocket";
import * as Lucide from "lucide-react";
import CameraList from "../cameras/CameraList";
import CameraNew from "../cameras/CameraNew";
import CameraView from "../cameras/CameraView";
import PeopleList from "../people/PeopleList";
import PersonNew from "../people/PersonNew";
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
  people: { title: "Pessoas", icon: <Lucide.Users size={20} />, component: PeopleList },
  "person-new": { title: "Nova Pessoa", icon: <Lucide.UserPlus size={20} />, component: PersonNew },
  "role-management": { title: "Gerenciar Cargos", icon: <Lucide.FolderTree size={20} />, component: RoleManagement },
  notifications: { title: "Notificações", icon: <Lucide.Bell size={20} />, component: NotificationList },
  settings: { title: "Configurações", icon: <Lucide.Settings size={20} />, component: Settings },
};

const mockCameras: {
  id: number;
  name: string;
  video_source: string;
  connection_type: string;
  detectionline: boolean;
}[] = [];

export default function Dashboard() {
  const [activeView, setActiveView] = useState<ViewId | null>(null);
  const imageRefs = useRef<Map<string, HTMLImageElement>>(new Map());

  useEffect(() => {
    const wsKeys: string[] = [];
    mockCameras.forEach((camera) => {
      if (!camera.video_source) return;

      const key = connectCamera(
        camera.id,
        camera.video_source,
        camera.detectionline ? "area-detection" : "camera",
        (blob) => {
          const img = imageRefs.current.get(`cam-${camera.id}`);
          if (img) {
            const url = URL.createObjectURL(blob);
            img.src = url;
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }
        }
      );
      wsKeys.push(key);
    });

    return () => {
      wsKeys.forEach(disconnectCamera);
    };
  }, []);

  const close = () => setActiveView(null);

  const viewEntry = activeView ? viewConfig[activeView] : undefined;
  const ViewComponent = viewEntry?.component;

  return (
    <>
      <audio id="soundEffect" src="/static/sounds/notify.mp3" preload="auto" />

      <div className={`w-full min-h-screen bg-black relative z-10 transition-all duration-500 ${activeView ? "brightness-[0.3]" : ""}`}>
        {mockCameras.length === 0 ? (
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
              gridTemplateColumns: `repeat(${Math.min(mockCameras.length, 3)}, 1fr)`,
              gridTemplateRows: `repeat(${Math.ceil(mockCameras.length / 3)}, 1fr)`,
            }}
          >
            {mockCameras.map((camera) => (
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
