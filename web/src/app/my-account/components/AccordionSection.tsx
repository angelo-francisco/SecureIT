"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, RefreshCw, Loader } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface AccordionSectionProps {
  title: string;
  icon: LucideIcon;
  onOpen?: () => Promise<void>;
  onRefresh?: () => void;
  loading?: boolean;
  children: ReactNode;
}

export function AccordionSection({
  title,
  icon: Icon,
  onOpen,
  onRefresh,
  loading = false,
  children,
}: AccordionSectionProps) {
  const [open, setOpen] = useState(false);
  const [opening, setOpening] = useState(false);

  const handleToggle = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    if (onOpen) {
      setOpening(true);
      try {
        await onOpen();
      } catch {}
      setOpening(false);
      setOpen(true);
    } else {
      setOpen(true);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-5">
        <button
          onClick={handleToggle}
          disabled={opening}
          className="flex items-center gap-3 flex-1 text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 transition-transform duration-200 hover:scale-105">
            <Icon size={20} className="text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-text">{title}</h3>
        </button>

        <div className="flex items-center gap-1">
          {onRefresh && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRefresh();
              }}
              disabled={loading}
              className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-all disabled:opacity-50"
              title="Atualizar"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : "transition-transform hover:rotate-180 duration-500"}
              />
            </button>
          )}
          {opening ? (
            <div className="p-2">
              <Loader size={20} className="text-primary animate-spin" />
            </div>
          ) : (
            <button
              onClick={handleToggle}
              className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-all"
            >
              <ChevronDown
                size={20}
                className={`transition-transform duration-300 ease-out ${
                  open ? "rotate-180" : ""
                }`}
              />
            </button>
          )}
        </div>
      </div>

      <div
        className="accordion-grid"
        data-open={open}
      >
        <div>
          <div className="border-t border-border p-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
