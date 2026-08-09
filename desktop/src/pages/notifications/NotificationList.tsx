import { useState } from "react";
import { useNotifications, useDeleteNotification } from "../../hooks";
import { usePanelNavigate } from "../../hooks/usePanelNavigate";
import { getApiBaseUrl } from "../../api-client/client";
import { Loader, Pagination, Modal } from "@/packages/ui";
import * as Lucide from "lucide-react";

interface NotificationListProps {
  onClose?: () => void;
  onInspectPerson?: (personId: number) => void;
}

interface ImageModalData {
  url: string;
  personId?: number | null;
}

export default function NotificationList({ onClose, onInspectPerson }: NotificationListProps) {
  const [page, setPage] = useState(1);
  const [imageModal, setImageModal] = useState<ImageModalData | null>(null);
  const panelNavigate = usePanelNavigate();

  const { data, isLoading } = useNotifications(page);
  const deleteNotification = useDeleteNotification();

  function openImage(photo?: string | null, personId?: number | null) {
    if (!photo) return;
    setImageModal({ url: `${getApiBaseUrl()}/media/${photo}`, personId });
  }

  function inspectPerson(personId?: number | null) {
    if (personId && onInspectPerson) onInspectPerson(personId);
  }

  return (
    <div className="flex-1 h-full flex flex-col relative overflow-hidden">
      <header className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Lucide.Bell size={22} className="text-primary" />
          <h2 className="text-xl font-bold text-text">Notificações</h2>
        </div>
        <div className="flex items-center gap-3">
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
                onClick={() => openImage(n.photo, n.person_id)}
                className={`flex items-center gap-4 px-5 py-3.5 border-b border-white/[0.06] transition-colors ${
                  n.photo ? "cursor-pointer hover:bg-white/[0.02]" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text">{n.title}</p>
                  <p className="text-sm text-text-muted mt-0.5 truncate">{n.description}</p>
                  {(n.photo || n.camera_name || n.person_id) && (
                    <div className="flex items-center gap-4 mt-1.5">
                      {n.photo && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openImage(n.photo, n.person_id);
                          }}
                          className="text-xs text-primary hover:underline"
                        >
                          Ver Imagem
                        </button>
                      )}
                      {n.person_id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            inspectPerson(n.person_id);
                          }}
                          className="text-xs text-green-400 hover:underline"
                        >
                          Ver Pessoa
                        </button>
                      )}
                      {n.camera_name && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            panelNavigate?.("camera-monitor");
                          }}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification.mutate(n.id);
                  }}
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
              src={imageModal.url}
              alt="Imagem da Notificação"
            />
            {imageModal.personId && onInspectPerson && (
              <button
                onClick={() => inspectPerson(imageModal.personId)}
                className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-green-500/90 hover:bg-green-500 text-black text-sm font-semibold transition-colors"
              >
                <Lucide.User size={14} />
                Ver Pessoa
              </button>
            )}
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
