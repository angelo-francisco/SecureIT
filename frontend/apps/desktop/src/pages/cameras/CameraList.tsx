import { useState } from "react";
import { Link } from "react-router-dom";
import { useCameras, useDeleteCamera } from "../../hooks";
import { usePanelNavigate } from "../../hooks/usePanelNavigate";
import { Button, Table, Badge, Loader, Modal } from "../../ui";
import * as Lucide from "lucide-react";
import { formatDateTime } from "../../lib/utils";

export default function CameraList() {
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { data: cameras, isLoading } = useCameras(search || undefined);
  const deleteCamera = useDeleteCamera();
  const panelNavigate = usePanelNavigate();

  const handleDelete = async () => {
    if (deleteId) {
      await deleteCamera.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const columns = [
    {
      key: "get_name",
      header: "ID",
      render: (row: Record<string, unknown>) => {
        const cam = row as unknown as { id: number; get_name: string };
        return (
          <Link
            to={`/cameras/${cam.id}`}
            className="text-blue-500 hover:underline"
          >
            {cam.get_name}
          </Link>
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
    },
    {
      key: "actions",
      header: "Acções",
      className: "text-center",
      render: (row: Record<string, unknown>) => {
        const cam = row as unknown as { id: number };
        return (
          <div className="flex gap-1 justify-center items-center">
            <Link
              to={`/cameras/${cam.id}/edit`}
              className="p-2 rounded bg-surface-hover text-text-secondary hover:text-primary transition-colors"
              title="Editar"
            >
              <Lucide.Pencil size={16} />
            </Link>
            <button
              onClick={() => setDeleteId(cam.id)}
              className="p-2 rounded bg-surface-hover text-text-secondary hover:text-red-500 transition-colors"
              title="Remover"
            >
              <Lucide.Trash size={16} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <main className="flex-1 h-full flex flex-col relative overflow-hidden">
      <header className="w-full px-6 py-4 lg:px-10 lg:py-6 flex flex-col gap-4 shrink-0 z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 gap-4 border-b border-gray-600">
          <h2 className="text-white text-3xl md:text-4xl font-bold">Câmaras</h2>
          <div className="flex gap-4 items-start lg:items-center justify-between">
            <form
              className="relative w-full lg:w-96"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-secondary">
                <Lucide.Search size={20} />
              </div>
              <input
                className="border border-gray/90 block w-full p-2.5 pl-10 text-sm text-white bg-surface-dark rounded-lg focus:ring-1 focus:ring-primary placeholder-text-secondary"
                placeholder="Buscar por localização..."
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
            <Link
              to="/cameras"
              className="flex items-center justify-center gap-2 rounded-lg h-10 px-5 bg-gray-600 hover:bg-gray-600 text-white text-sm font-bold tracking-wide transition-all"
            >
              <Lucide.Eraser size={16} />
            </Link>
            {panelNavigate ? (
              <button
                onClick={() => panelNavigate("camera-new")}
                className="flex items-center justify-center gap-2 rounded-lg h-10 px-5 bg-primary hover:bg-blue-600 text-white text-sm font-bold tracking-wide transition-all shadow-lg shadow-primary/20 cursor-pointer"
              >
                <Lucide.Plus size={16} />
                <span className="hidden xl:block">Adicionar Nova Câmera</span>
              </button>
            ) : (
              <Link
                to="/cameras/new"
                className="flex items-center justify-center gap-2 rounded-lg h-10 px-5 bg-primary hover:bg-blue-600 text-white text-sm font-bold tracking-wide transition-all shadow-lg shadow-primary/20"
              >
                <Lucide.Plus size={16} />
                <span className="hidden xl:block">Adicionar Nova Câmera</span>
              </Link>
            )}
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-10">
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
          <div className="w-full flex justify-center items-center flex-col text-center gap-1 mt-3">
            <Lucide.VideoOff size={40} />
            <div className="flex flex-col gap-2 max-w-md">
              <h3 className="text-white text-xl font-bold">
                Sem câmara registadas/encontradas
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Adicione alguma câmera para começar a monitorar
              </p>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        className="max-w-md bg-surface-dark border border-border-dark rounded-xl p-6"
      >
        <h3 className="text-xl font-bold text-white mb-4">
          Confirmar remoção
        </h3>
        <p className="text-text-muted mb-6">
          Tem a certeza que deseja remover esta câmara?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Remover
          </Button>
        </div>
      </Modal>
    </main>
  );
}
