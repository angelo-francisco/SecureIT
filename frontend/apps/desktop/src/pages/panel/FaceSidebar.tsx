import { useEffect, useRef } from "react";
import { useFaceEventsStore } from "../../stores/faceEvents";
import * as Lucide from "lucide-react";

interface FaceSidebarProps {
  onInspectPerson?: (personId: number) => void;
}

export default function FaceSidebar({ onInspectPerson }: FaceSidebarProps) {
  const events = useFaceEventsStore((s) => s.events);
  const clearEvents = useFaceEventsStore((s) => s.clearEvents);
  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length]);

  return (
    <div className="w-80 shrink-0 border-l border-white/[0.08] bg-[#0B0E14] flex flex-col h-[100vh]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] shrink-0">
        <div className="flex items-center gap-2">
          <Lucide.ScanFace size={18} className="text-primary" />
          <span className="text-sm font-semibold text-text">Rostos Detectados</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-text-muted font-mono">
            {events.length}
          </span>
        </div>
        {events.length > 0 && (
          <button
            onClick={clearEvents}
            className="text-xs text-text-muted hover:text-white transition-colors"
          >
            Limpar
          </button>
        )}
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 mt-16 text-text-muted px-4 text-center">
            <Lucide.ScanFace size={28} />
            <span className="text-xs">Nenhum rosto detectado</span>
          </div>
        ) : (
          <div className="flex flex-col">
            {events.map((ev) => (
              <div
                key={ev.id}
                className={`flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors ${
                  ev.person_id && onInspectPerson ? "cursor-pointer" : ""
                }`}
                onClick={() => {
                  if (ev.person_id && onInspectPerson) onInspectPerson(ev.person_id);
                }}
              >
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    ev.unknown ? "bg-red-500" : "bg-green-500"
                  }`}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-medium truncate ${ev.unknown ? "text-red-400" : "text-green-400"}`}>
                      {ev.unknown ? "Desconhecido" : ev.name}
                    </span>
                    <span className={`text-[9px] px-1 py-0.5 rounded font-medium ${ev.unknown ? "bg-red-400/10 text-red-400" : "bg-green-400/10 text-green-400"}`}>
                      {(ev.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-text-muted truncate">{ev.camera_name}</span>
                    <span className="text-[10px] text-text-muted/60">
                      {new Date(ev.timestamp).toLocaleTimeString("pt-PT")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  );
}
