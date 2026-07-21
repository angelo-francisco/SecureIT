import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, children, className = "" }: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 min-h-screen flex items-center justify-center backdrop-blur-sm z-[1000]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className={className}>{children}</div>
    </div>
  );
}
