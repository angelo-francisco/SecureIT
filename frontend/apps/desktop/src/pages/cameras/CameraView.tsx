import { useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useCamera } from "../../hooks";
import { Loader, Badge } from "../../ui";
import { connectCamera, disconnectCamera } from "../../lib/websocket";
import * as Lucide from "lucide-react";

export default function CameraView() {
  const { id } = useParams<{ id: string }>();
  const { data: camera, isLoading } = useCamera(Number(id));
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!camera?.video_source || !id) return;

    const videoSource =
      camera.connection_type === "L"
        ? Number(camera.video_source)
        : camera.video_source;

    const key = connectCamera(
      id,
      videoSource,
      camera.detectionline ? "area-detection" : "camera",
      (blob) => {
        if (imageRef.current) {
          const url = URL.createObjectURL(blob);
          imageRef.current.src = url;
          setTimeout(() => URL.revokeObjectURL(url), 500);
        }
      }
    );

    return () => {
      disconnectCamera(key);
    };
  }, [camera, id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-76px)] w-full">
        <Loader w={50} />
      </div>
    );
  }

  if (!camera) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-76px)] w-full">
        <p className="text-white text-xl">Câmara não encontrada</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-[#0b0f14] fixed w-full h-full z-[-1]" />
      <main className="p-4 lg:p-8 grid grid-cols-1 gap-6 relative z-10">
        <div className="flex items-center justify-center p-1">
          <div className="relative w-full flex items-center justify-center bg-black rounded-2xl overflow-hidden shadow-2xl max-h-[70vh]">
            <img
              ref={imageRef}
              className="w-full h-auto aspect-video object-contain max-h-[70vh]"
              alt={camera.name}
            />
          </div>
        </div>
        <div className="bg-[#161b22] rounded-2xl p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-gray-700 pb-3 gap-5">
            <h2 className="text-2xl font-semibold truncate max-w-2xl">
              {camera.name}
            </h2>
            <div className="flex gap-2">
              <Link
                to={`/cameras/${camera.id}/edit`}
                className="p-2 rounded-lg bg-gray-600/20 hover:bg-gray-600/30 transition"
              >
                <Lucide.Pencil size={20} />
              </Link>
              <Link
                to={`/cameras/${camera.id}/edit`}
                className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 transition"
              >
                <Lucide.Trash size={20} />
              </Link>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm uppercase text-gray-400 text-base">
              Estado
            </span>
            <Badge variant={camera.status ? "success" : "error"}>
              {camera.status ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="uppercase text-gray-400 text-base">Conexão</span>
            <span className="flex items-center gap-2 text-base">
              {camera.connection_type === "W" ? (
                <Lucide.Wifi size={20} />
              ) : (
                <Lucide.Usb size={20} />
              )}
              {camera.get_connection_type_display}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-base uppercase text-gray-400">
              Localização
            </span>
            <span className="flex items-center gap-2 text-base">
              {camera.location}
            </span>
          </div>
          {camera.connection_type === "W" && camera.wificamera && (
            <div className="flex justify-between items-center">
              <span className="text-base uppercase text-gray-400">Stream</span>
              <span className="truncate text-base max-w-[180px]">
                {camera.wificamera.stream_url}
              </span>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
