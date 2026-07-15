import { useState } from "react";
import { useNotifications, useDeleteNotification } from "../../hooks";
import { usePanelNavigate } from "../../hooks/usePanelNavigate";
import { getApiBaseUrl } from "../../api-client/client";
import { Loader, Pagination, Modal } from "@secureit/ui";
import * as Lucide from "lucide-react";

interface NotificationListProps {
  onClose?: () => void;
}

const filters = [
  { value: "A" as const, label: "Todas" },
  { value: "NR" as const, label: "Não Lidas" },
  { value: "R" as const, label: "Lidas" },
];

export default function NotificationList({ onClose }: NotificationListProps) {
  const [filter, setFilter] = useState<"A" | "NR" | "R">("A");
  const [page, setPage] = useState(1);
  const [imageModal, setImageModal] = useState<string | null>(null);
  const panelNavigate = usePanelNavigate();

  const { data, isLoading } = useNotifications(
    { search_query: filter },
    page
  );
  const deleteNotification = useDeleteNotification();

  const levelIcon = (level: string) => {
    switch (level) {
      case "I":
        return <Lucide.Info size={20} className="text-blue-400" />;
      case "E":
        return <Lucide.Ban size={20} className="text-red-400" />;
      case "S":
      case "P":
        return <Lucide.CircleAlert size={20} className="text-amber-400" />;
      default:
        return <Lucide.Bell size={20} className="text-text-muted" />;
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col relative overflow-hidden">
      <header className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Lucide.Bell size={22} className="text-primary" />
          <h2 className="text-xl font-bold text-text">Notificações</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-1">
            {filters.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setFilter(opt.value);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === opt.value
                    ? "bg-primary/15 text-primary shadow-sm"
                    : "text-text-muted hover:text-text"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
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
        ) : data && Array.isArray(data.results) && data.results.length > 0 ? (
          <div className="flex flex-col gap-2">
            {data.results.map((n) => (
              <div
                key={n.id}
                className="flex items-start gap-3 bg-surface border border-border rounded-xl px-5 py-4"
              >
                <div className="mt-0.5">{levelIcon(n.level)}</div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-sm font-semibold text-text">{n.title}</h1>
                  <p className="text-sm text-text-muted mt-0.5">{n.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    {n.photo && (
                      <button
                        onClick={() => setImageModal(`${getApiBaseUrl()}/media/${n.photo}`)}
                        className="text-xs text-primary hover:underline"
                      >
                        Ver Imagem
                      </button>
                    )}
                    {n.camera_name && (
                      <button
                        onClick={() => panelNavigate?.("camera-monitor")}
                        className="text-xs text-primary hover:underline"
                      >
                        {n.camera_name}
                      </button>
                    )}
                    <span className="text-xs text-text-muted">
                      {n.created_at}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => deleteNotification.mutate(n.id)}
                  className="p-2 rounded-lg hover:bg-white/[0.06] text-text-muted hover:text-red-500 transition-colors shrink-0"
                >
                  <Lucide.Trash size={16} />
                </button>
              </div>
            ))}
            <Pagination
              page={data.number ?? 1}
              numPages={data.num_pages ?? 1}
              hasNext={data.has_next ?? false}
              hasPrevious={data.has_previous ?? false}
              onPageChange={setPage}
            />
          </div>
        ) : (
          <div className="w-full flex justify-center items-center flex-col text-center gap-3 mt-16">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center">
              <Lucide.BellOff size={28} className="text-text-muted" />
            </div>
            <div className="flex flex-col gap-1 max-w-md">
              <h3 className="text-text font-semibold text-base">
                Nenhuma notificação
              </h3>
              <p className="text-text-muted text-sm leading-relaxed">
                Quando houver alertas, aparecerão aqui
              </p>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={!!imageModal}
        onClose={() => setImageModal(null)}
        className="relative"
      >
        {imageModal && (
          <div className="relative">
            <img
              className="max-w-[90vw] max-h-[80vh] rounded-lg"
              src={imageModal}
              alt="Imagem da Notificação"
            />
            <button
              onClick={() => setImageModal(null)}
              className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
            >
              <Lucide.X size={20} />
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
