import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: string;
}

export function Input({ className = "", ...props }: InputProps) {
  return (
    <div className="relative w-full">
      <input
        className={`form-input w-full h-12 border border-border bg-surface text-text placeholder:text-text-muted px-4 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition ${className}`}
        {...props}
      />
    </div>
  );
}
