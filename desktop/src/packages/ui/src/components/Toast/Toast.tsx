import * as react from 'react';
import * as Lucide from "lucide-react";
import { create } from "zustand";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  onClick?: () => void;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2);
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 5000);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

const iconMap: Record<ToastType, react.ForwardRefExoticComponent<any>> = {
  success: Lucide.CheckCircle,
  error: Lucide.AlertCircle,
  warning: Lucide.AlertTriangle,
  info: Lucide.Info,
};

const bgMap: Record<ToastType, string> = {
  success: "bg-green-500/15 border-green-500/30 text-green-400",
  error: "bg-red-500/15 border-red-500/30 text-red-400",
  warning: "bg-yellow-500/15 border-yellow-500/30 text-yellow-400",
  info: "bg-primary/15 border-primary/30 text-primary",
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type];
        return (
          <div
            key={toast.id}
            onClick={() => {
              toast.onClick?.();
              removeToast(toast.id);
            }}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm animate-in slide-in-from-right ${bgMap[toast.type]} ${toast.onClick ? "cursor-pointer" : ""}`}
          >
            <Icon size={18} className="shrink-0 mt-0.5" />
            <p className="text-lg flex-1">{toast.message}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            >
              <Lucide.X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
