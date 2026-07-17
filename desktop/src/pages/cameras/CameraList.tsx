import { useState } from "react";
import { useCameras } from "../../hooks";
import { usePanelNavigate } from "../../hooks/usePanelNavigate";
import { useCameraViewStore } from "../../stores/cameraView";
import { Button, Table, Badge, Loader, Input } from "@/packages/ui";
import * as Lucide from "lucide-react";
import { formatDateTime } from "../../lib/utils";

interface CameraListProps {
  onClose?: () => void;
}

export default function CameraList({ onClose }: CameraListProps) {
  const [search, setSearch] = useState("");
  const { data: cameras, isLoading } = useCameras(search || undefined);
  const panelNavigate = usePanelNavigate();

  const columns = [
    {
      key: "get_name",
      header: "ID",
      render: (row: Record<string, unknown>) => {
        const cam = row as unknown as { id: number; get_name: string };
        return (

          <span className="text-primary font-medium hover:underline cursor-pointer" onClick={() => {
            useCameraViewStore.getState().setCameraId(cam.id);
            panelNavigate?.("camera-view");
          }
          }>{cam.get_name}</span>
        );
      },
    },
    { key: "name", header: "Nome" },
    { key: "location", header: "Localização" },
    {
      key: "status",
      header: "Estado",
      render: (row: Record<string, unknown>) => {
        const status = Boolean(row.status);
        return (
          <Badge variant={status ? "success" : "error"}>
            {status ? "Online" : "Offline"}
          </Badge>
        );
      },
    },
    {
      key: "created_at",
      header: "Data de Adição",
      render: (row: Record<string, unknown>) =>
        formatDateTime(row.created_at as string),
    },
    {
      key: "updated_at",
      header: "Última actualização",
      render: (row: Record<string, unknown>) =>
        formatDateTime(row.updated_at as string),
    }
  ];

  return (
    <div className="flex-1 h-full flex flex-col relative overflow-hidden">
      <header className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Lucide.Video size={22} className="text-primary" />
          <h2 className="text-xl font-bold text-text">Câmaras</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Lucide.Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder="Buscar por localização..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Button
            size="sm"
            icon={<Lucide.Plus size={14} />}
            onClick={() => panelNavigate?.("camera-new")}
          >
            Nova Câmera
          </Button>
          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-gray-400 hover:text-white transition-all duration-150"
            >
              <Lucide.X size={16} strokeWidth={2} />
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto mt-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader w={50} />
          </div>
        ) : cameras && cameras.length > 0 ? (
          <Table
            columns={columns}
            data={cameras as unknown as Record<string, unknown>[]}
          />
        ) : (
          <div className="w-full flex justify-center items-center flex-col text-center gap-3 mt-16">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center">
              <Lucide.VideoOff size={28} className="text-text-muted" />
            </div>
            <div className="flex flex-col gap-1 max-w-md">
              <h3 className="text-text font-semibold text-base">
                Sem câmaras registadas
              </h3>
              <p className="text-text-muted text-sm leading-relaxed">
                Adicione alguma câmera para começar a monitorar
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
