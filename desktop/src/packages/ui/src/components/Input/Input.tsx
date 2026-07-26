import type { InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, type, ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-12 w-full border border-border bg-surface px-4 py-2 text-sm text-text placeholder:text-text-muted file:border-0 file:bg-transparent file:text-sm file:font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50 transition",
        className
      )}
      {...props}
    />
  );
}
