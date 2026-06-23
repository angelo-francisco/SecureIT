import { cn } from "../lib/utils";
import type { InputHTMLAttributes } from "react";

interface FloatingLabelInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
}

export function FloatingLabelInput({ label, id, className, ...props }: FloatingLabelInputProps) {
  return (
    <div className="relative">
      <input
        id={id}
        className={cn(
          "peer w-full border-0 bg-transparent px-0 pt-5 pb-1.5 text-text placeholder-transparent caret-primary",
          "focus:outline-none focus:ring-0 transition-colors",
          className
        )}
        placeholder=" "
        {...props}
      />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
      <div className="absolute bottom-0 left-0 right-0 mx-auto h-[2px] bg-primary scale-x-0 peer-focus:scale-x-100 transition-transform duration-300 ease-in-out" />
      <label
        htmlFor={id}
        className="absolute left-0 cursor-text select-none transition-all duration-200 text-text-muted peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-[:not(:placeholder-shown)]:-top-0.5 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-primary peer-focus:-top-0.5 peer-focus:text-xs peer-focus:text-primary"
      >
        {label}
      </label>
    </div>
  );
}
