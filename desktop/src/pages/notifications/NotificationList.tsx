import { useState } from "react";
import { useNotifications, useDeleteNotification } from "../../hooks";
import { usePanelNavigate } from "../../hooks/usePanelNavigate";
import { getApiBaseUrl } from "../../api-client/client";
import { Loader, Pagination, Modal } from "@/packages/ui";
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

  return (
    <div className="flex-1 h-full flex flex-col relative overflow-hidden">
      <header className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Lucide.Bell size={22} className="text-primary" />
          <h2 className="text-xl font-bold text-text">Notificações</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white/[0.04] p-1">
            {filters.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setFilter(opt.value);
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-sm font-medium transition-all ${
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
              className="flex items-center justify-center w-8 h-8 bg-white/[0.06] hover:bg-white/[0.12] text-gray-400 hover:text-white transition-all duration-150"
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
          <div className="flex flex-col">
            {data.results.map((n) => (
              <div
                key={n.id}
                className="flex items-center gap-4 px-5 py-3.5 border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text">{n.title}</p>
                  <p className="text-sm text-text-muted mt-0.5 truncate">{n.description}</p>
                  {(n.photo || n.camera_name) && (
                    <div className="flex items-center gap-4 mt-1.5">
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
                    </div>
                  )}
                </div>
                <span className="text-xs text-text-muted whitespace-nowrap shrink-0">
                  {n.created_at}
                </span>
                <button
                  onClick={() => deleteNotification.mutate(n.id)}
                  className="p-2 hover:bg-white/[0.06] text-text-muted hover:text-red-500 transition-colors shrink-0"
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
            <div className="w-14 h-14 bg-white/[0.04] flex items-center justify-center">
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
              className="max-w-[90vw] max-h-[80vh]"
              src={imageModal}
              alt="Imagem da Notificação"
            />
            <button
              onClick={() => setImageModal(null)}
              className="absolute top-2 right-2 p-2 bg-black/50 text-white hover:bg-black/70"
            >
              <Lucide.X size={20} />
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
