import { useEffect, useRef } from "react";
import { FloatingNavbar } from "../../components/FloatingNavbar";
import { connectCamera, disconnectCamera } from "../../lib/websocket";
import * as Lucide from "lucide-react";

const mockCameras: {
  id: number;
  name: string;
  video_source: string;
  connection_type: string;
  detectionline: boolean;
}[] = [];

export default function Dashboard() {
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

  return (
    <>
      <audio id="soundEffect" src="/static/sounds/notify.mp3" preload="auto" />
      <FloatingNavbar />

      {mockCameras.length === 0 ? (
        <div className="w-full h-[100vh] flex flex-col items-center justify-center bg-black relative z-10">
          <Lucide.VideoOff size={60} className="text-white" />
          <span className="text-xl text-white mt-4">
            Sem câmeras registadas
          </span>
        </div>
      ) : (
        <main
          className="w-full h-[100vh] bg-black grid relative z-10"
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
    </>
  );
}
