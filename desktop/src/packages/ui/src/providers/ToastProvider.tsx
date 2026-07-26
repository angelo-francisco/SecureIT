"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { CheckCircle2, Info, AlertCircle, X } from "lucide-react";

export type ToastType = "error" | "success" | "info";

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  visible: boolean;
}

export interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);

  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return ctx;
}

export function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === id ? { ...toast, visible: false } : toast
      )
    );

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 250);
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "error") => {
      const id = ++counter.current;

      setToasts((prev) =>
        [
          {
            id,
            message,
            type,
            visible: false,
          },
          ...prev,
        ].slice(0, 5)
      );

      requestAnimationFrame(() => {
        setToasts((prev) =>
          prev.map((toast) =>
            toast.id === id ? { ...toast, visible: true } : toast
          )
        );
      });

      setTimeout(() => dismiss(id), 5000);
    },
    [dismiss]
  );

  const getAccentColor = (type: ToastType) => {
    switch (type) {
      case "success":
        return "bg-success";
      case "error":
        return "bg-error";
      case "info":
        return "bg-blue-500";
    }
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case "success":
        return <CheckCircle2 size={18} className="text-success" />;
      case "error":
        return <AlertCircle size={18} className="text-error" />;
      case "info":
        return <Info size={18} className="text-blue-500" />;
    }
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      <div className="pointer-events-none fixed right-5 top-5 z-[9999] flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
    pointer-events-auto
    relative
    overflow-hidden
    border
    border-border
    bg-surface
    text-text
    shadow-lg
    transition-all
    duration-300
    ease-out
    ${toast.visible
                ? "translate-x-0 opacity-100 scale-100"
                : "translate-x-10 opacity-0 scale-95"
              }
  `}
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="flex-1 text-base font-medium leading-6">
                {toast.message}
              </span>

              <button
                onClick={() => dismiss(toast.id)}
                className="cursor-pointer text-text/60 transition-colors hover:text-text"
              >
                <X size={18} />
              </button>
            </div>

            <div className="absolute bottom-0 left-0 h-[2px] w-full bg-text/10">
              <div
                className="h-full bg-text/40 animate-[toast-progress_5s_linear_forwards]"
                style={{ transformOrigin: "left" }}
              />
            </div>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes toast-progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}