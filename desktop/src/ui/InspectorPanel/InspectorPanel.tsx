import * as Lucide from "lucide-react";

interface InspectorPanelProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
}

export function InspectorPanel({ open, onClose, title, children }: InspectorPanelProps) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <div
        className={`fixed right-0 top-0 h-full w-[420px] z-[1000] bg-surface border-l border-border shadow-2xl transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-text">{title ?? "Inspetor"}</h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-gray-400 hover:text-white transition-all duration-150"
          >
            <Lucide.X size={16} strokeWidth={2} />
          </button>
        </div>
        <div className="h-[calc(100%-61px)] overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}
