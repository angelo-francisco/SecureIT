import { useState } from "react";
import { useCameras, useRefreshLocalDevices } from "../../hooks";
import { usePanelNavigate } from "../../hooks/usePanelNavigate";
import { useCameraViewStore } from "../../stores/cameraView";
import { useToast } from "../../hooks/useToast";
import { Button, Table, Badge, Loader, Input } from "@/packages/ui";
import * as Lucide from "lucide-react";
import { formatDateTime } from "../../lib/utils";

interface CameraListProps {
  onClose?: () => void;
}

export default function CameraList({ onClose }: CameraListProps) {
  const [search, setSearch] = useState("");
  const { data: cameras, isLoading } = useCameras(search || undefined);
  const refreshDevices = useRefreshLocalDevices();
  const panelNavigate = usePanelNavigate();
  const { toast } = useToast();

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
          <Lucide.Video size={30} className="text-primary" />
          <h2 className="text-2xl font-bold text-text">Câmaras</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Lucide.Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder="Nome ou localização..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-12 text-lg rounded-none"
            />
          </div>
          <Button
            size="lg"
            variant="secondary"
            icon={refreshDevices.isPending ? <Loader w={18} /> : <Lucide.RefreshCw size={18} />}
            onClick={() =>
              refreshDevices.mutate(undefined, {
                onSuccess: (devices) =>
                  toast(
                    devices.length > 0
                      ? `${devices.length} câmara(s) local(is) identificada(s)`
                      : "Nenhuma câmara local identificada",
                    "success"
                  ),
                onError: () => toast("Erro ao identificar câmaras locais", "error"),
              })
            }
            disabled={refreshDevices.isPending}
            className="rounded-none cursor-pointer"
          >
            Identificar
          </Button>
          <Button
            size="lg"
            icon={<Lucide.Plus size={18} />}
            onClick={() => panelNavigate?.("camera-new")}
            className="rounded-none cursor-pointer"
          >
            Nova Câmera
          </Button>
          {onClose && (
            <button
              onClick={onClose}
              className="cursor-pointer flex items-center justify-center w-13 h-12 border border-gray-400 transition-all duration-150"
            >
              <Lucide.X size={20} strokeWidth={2} />
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
            <div className="w-14 h-14 bg-white/[0.04] flex items-center justify-center">
              <Lucide.VideoOff size={28} className="text-text-muted" />
            </div>
            <div className="flex flex-col gap-1/2 max-w-md">
              <h3 className="text-text font-semibold text-xl">
                Sem câmaras registadas
              </h3>
              <p className="text-text-muted text-lg leading-relaxed">
                Adicione alguma câmera para começar a monitorar
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
