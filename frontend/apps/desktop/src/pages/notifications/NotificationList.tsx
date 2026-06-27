import { useState } from "react";
import { Link } from "react-router-dom";
import { useNotifications, useDeleteNotification } from "../../hooks";
import { Loader, Pagination, Modal } from "../../ui";
import * as Lucide from "lucide-react";

export default function NotificationList() {
  const [filter, setFilter] = useState<"A" | "NR" | "R">("A");
  const [page, setPage] = useState(1);
  const [imageModal, setImageModal] = useState<string | null>(null);

  const { data, isLoading } = useNotifications(
    { search_query: filter },
    page
  );
  const deleteNotification = useDeleteNotification();

  const handleDelete = (id: number) => {
    deleteNotification.mutate(id);
  };

  const levelIcon = (level: string) => {
    switch (level) {
      case "I":
        return <Lucide.Info size={24} />;
      case "E":
        return <Lucide.Ban size={24} />;
      case "S":
      case "P":
        return <Lucide.CircleAlert size={24} />;
      default:
        return <Lucide.Bell size={24} />;
    }
  };

  return (
    <main className="w-full flex-1 h-full flex flex-col items-center overflow-hidden py-6 px-4 relative z-10">
      <header className="max-w-3xl w-full flex flex-col items-center gap-4 border-b border-gray-500">
        <h2 className="text-white text-2xl md:text-4xl font-bold">
          Notificações
        </h2>
        <form className="flex gap-4">
          {[
            { value: "A" as const, label: "Todas" },
            { value: "NR" as const, label: "Não Lidas" },
            { value: "R" as const, label: "Lidas" },
          ].map((opt) => (
            <div key={opt.value} className="flex items-center mb-4 gap-2">
              <input
                type="radio"
                value={opt.value}
                checked={filter === opt.value}
                onChange={() => {
                  setFilter(opt.value);
                  setPage(1);
                }}
                className="cursor-pointer w-4 h-4 border rounded-lg bg-none focus:ring-2 focus:ring-brand-soft"
              />
              <label className="select-none ms-2 text-base font-medium text-white">
                {opt.label}
              </label>
            </div>
          ))}
        </form>
      </header>

      <div className="max-w-3xl w-full flex-1 pt-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader w={50} />
          </div>
        ) : data && Array.isArray(data.results) && data.results.length > 0 ? (
          <div className="flex flex-col gap-3">
            {data.results.map((n) => (
              <div
                key={n.id}
                className="relative flex items-start gap-3 bg-[#1E2939] border border-gray-700 rounded-lg px-5 py-4"
              >
                <div className="icon mt-1">{levelIcon(n.level)}</div>
                <div className="info flex-1">
                  <h1 className="text-xl font-semibold">{n.title}</h1>
                  <p className="text-lg text-gray-300">{n.description}</p>
                  <div className="pt-2 flex flex-row items-center gap-3">
                    {n.photo && (
                      <button
                        onClick={() => setImageModal(n.photo || null)}
                        className="text-lg px-2 rounded-lg py-1 underline text-blue-300 cursor-pointer"
                      >
                        Ver Imagem
                      </button>
                    )}
                    <Link
                      to={`/cameras/${n.camera}`}
                      className="px-5 text-lg text-gray-200 underline"
                    >
                      {n.camera_name}
                    </Link>
                    <span className="px-5 text-lg text-gray-300">
                      {n.created_at}
                    </span>
                  </div>
                </div>
                <div className="pt-2 flex flex-row gap-3">
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="text-red-500 cursor-pointer"
                  >
                    <Lucide.Trash size={20} />
                  </button>
                </div>
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
          <div className="flex justify-center items-center flex-col text-center gap-1 mt-3">
            <Lucide.BellOff size={45} />
            <h3 className="text-white text-xl font-medium">
              Nenhuma notificação
            </h3>
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
    </main>
  );
}
