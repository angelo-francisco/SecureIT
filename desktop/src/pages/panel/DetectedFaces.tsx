import { useState } from "react";
import { useFaceDetections } from "../../hooks";
import { Button, Loader, Badge, Modal } from "@packages/ui";
import * as Lucide from "lucide-react";
import { getApiBaseUrl } from "../../api-client/client";

export default function DetectedFaces() {
  const [page, setPage] = useState(1);
  const [knownOnly, setKnownOnly] = useState(false);
  const { data, isLoading } = useFaceDetections(page, knownOnly);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const baseUrl = getApiBaseUrl();

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <button
          onClick={() => { setKnownOnly(!knownOnly); setPage(1); }}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
            knownOnly
              ? "bg-primary/15 border-primary/30 text-primary"
              : "bg-white/[0.04] border-white/[0.08] text-text-muted hover:text-text"
          }`}
        >
          <Lucide.UserCheck size={14} />
          Apenas conhecidos
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader w={50} />
        </div>
      ) : !data || data.results.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 mt-16 text-text-muted">
          <Lucide.ScanFace size={40} />
          <p>Nenhum rosto detectado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.results.map((detection) => (
            <div
              key={detection.id}
              className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors"
            >
              <div
                className="w-14 h-14 rounded-lg bg-black/40 overflow-hidden shrink-0 cursor-pointer border border-white/[0.08]"
                onClick={() => {
                  if (detection.photo) setPreviewPhoto(`${baseUrl}/media/${detection.photo}`);
                }}
              >
                {detection.photo ? (
                  <img
                    src={`${baseUrl}/media/${detection.photo}`}
                    alt="Rosto"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Lucide.Image size={18} className="text-text-muted" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text truncate">
                    {detection.unknown ? "Desconhecido" : detection.name}
                  </span>
                  <Badge variant={detection.unknown ? "error" : "success"}>
                    {detection.unknown ? "Desconhecido" : "Conhecido"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-text-muted">
                  <span>Confiança: {(detection.confidence * 100).toFixed(0)}%</span>
                  {detection.camera_name && <span>Câmera: {detection.camera_name}</span>}
                  <span>{new Date(detection.created_at).toLocaleString("pt-PT")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {data && data.num_pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6 pb-4">
          <Button
            size="sm"
            variant="secondary"
            disabled={!data.has_previous}
            onClick={() => setPage((p) => p - 1)}
            icon={<Lucide.ChevronLeft size={14} />}
          >
            Anterior
          </Button>
          <span className="text-xs text-text-muted">
            Página {data.number} de {data.num_pages}
          </span>
          <Button
            size="sm"
            variant="secondary"
            disabled={!data.has_next}
            onClick={() => setPage((p) => p + 1)}
            icon={<Lucide.ChevronRight size={14} />}
          >
            Seguinte
          </Button>
        </div>
      )}

      <Modal
        open={previewPhoto !== null}
        onClose={() => setPreviewPhoto(null)}
        className="max-w-2xl bg-surface-dark border border-border-dark rounded-xl p-2"
      >
        {previewPhoto && (
          <img src={previewPhoto} alt="Rosto detectado" className="w-full h-auto rounded-lg" />
        )}
      </Modal>
    </>
  );
}
