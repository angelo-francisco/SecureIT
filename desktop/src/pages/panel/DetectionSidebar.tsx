import { useEffect, useRef } from "react";
import { useDetectionEventsStore } from "../../stores/detectionEvents";
import * as Lucide from "lucide-react";

interface DetectionSidebarProps {
  onInspectPerson?: (personId: number) => void;
  navbarHidden?: boolean;
  onToggleNavbar?: () => void;
}

function eventTitle(
  type: string,
  unknown: boolean,
  name: string | null,
): string {
  if (type === "face") return unknown ? "Desconhecido" : name ?? "Desconhecido";
  if (type === "behaviour") return name ?? "Comportamento Suspeito";
  return name ?? "Pessoa(s) detectada(s)";
}

export default function DetectionSidebar({ onInspectPerson, navbarHidden, onToggleNavbar }: DetectionSidebarProps) {
  const events = useDetectionEventsStore((s) => s.events);
  const clearEvents = useDetectionEventsStore((s) => s.clearEvents);
  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length]);

  return (
    <div className="w-90 shrink-0 border-l border-white/[0.08] bg-[#0B0E14] flex flex-col h-[100vh]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] shrink-0">
        <div className="flex items-center gap-2">
          <Lucide.Bell size={18} className="text-primary" />
          <span className="text-sm font-semibold text-text">Detecções</span>
          <span className="text-[14px] px-1.5 text-text-muted font-mono">
            ({events.length})
          </span>
        </div>
        <div className="flex items-center gap-3">
          {onToggleNavbar && (
            <button
              onClick={onToggleNavbar}
              className="cursor-pointer p-1.5 text-text-muted hover:text-white hover:bg-white/[0.06] transition-colors"
              title={navbarHidden ? "Mostrar navbar" : "Ocultar navbar"}
            >
              {navbarHidden ? (
                <Lucide.PanelBottom size={16} />
              ) : (
                <Lucide.PanelBottomClose size={16} />
              )}
            </button>
          )}
          {events.length > 0 && (
            <button
              onClick={clearEvents}
              className="flex text-red-500 items-center gap-1 text-base hover:text-white transition-colors"
            >
              <Lucide.Trash2 size={14} />
              Limpar
            </button>
          )}
        </div>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 mt-16 text-text-muted px-4 text-center">
            <Lucide.Camera size={28} />
            <span className="text-xs">Nenhuma detecção</span>
          </div>
        ) : (
          <div className="flex flex-col">
            {events.map((ev) => {
              const isFace = ev.type === "face";
              const isBehaviour = ev.type === "behaviour";
              const dotColor = isBehaviour
                ? "bg-red-500 animate-pulse"
                : isFace
                  ? ev.unknown
                    ? "bg-red-500"
                    : "bg-green-500"
                  : "bg-amber-500";

              const nameColor = isBehaviour
                ? "text-red-400"
                : isFace
                  ? ev.unknown
                    ? "text-red-400"
                    : "text-green-400"
                  : "text-amber-400";

              const badgeColor = isBehaviour
                ? "bg-red-400/15 text-red-400 border border-red-400/30"
                : isFace
                  ? ev.unknown
                    ? "bg-red-400/10 text-red-400"
                    : "bg-green-400/10 text-green-400"
                  : "bg-amber-400/10 text-amber-400";

              const icon = isBehaviour ? (
                <Lucide.ShieldAlert size={16} />
              ) : isFace ? (
                <Lucide.ScanFace size={16} />
              ) : (
                <Lucide.Users size={16} />
              );

              return (
                <div
                  key={ev.id}
                  className={`flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.04] transition-colors ${
                    isBehaviour ? "bg-red-500/5 border-l-2 border-l-red-500" : "hover:bg-white/[0.03]"
                  } ${ev.person_id && onInspectPerson ? "cursor-pointer" : ""}`}
                  onClick={() => {
                    if (ev.person_id && onInspectPerson) onInspectPerson(ev.person_id);
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-base ${nameColor}`}>
                        {eventTitle(ev.type, ev.unknown, ev.name)}
                      </span>
                      {ev.confidence != null && (
                        <span className={`text-[9px] px-1 py-0.5 font-medium ${badgeColor}`}>
                          {(ev.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {icon}
                      <span className="text-sm text-text-muted truncate">{ev.camera_name}</span>
                      <span className="text-sm text-text-muted/60">
                        {new Date(ev.timestamp).toLocaleTimeString("pt-PT")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  );
}
