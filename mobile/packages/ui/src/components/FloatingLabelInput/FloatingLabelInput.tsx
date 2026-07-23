import type { InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export interface FloatingLabelInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: boolean;
}

export function FloatingLabelInput({ label, id, className, error, ...props }: FloatingLabelInputProps) {
  return (
    <div className="relative">
      <input
        id={id}
        className={cn(
          "peer w-full border-0 bg-transparent px-0 pt-5 pb-1.5 text-lg md:text-xl text-text placeholder-transparent caret-primary",
          "focus:outline-none focus:ring-0 transition-colors",
          error && "caret-error",
          className
        )}
        placeholder=" "
        {...props}
      />
      <div className={cn(
        "absolute bottom-0 left-0 right-0 h-px transition-colors",
        error ? "bg-error" : "bg-border"
      )} />
      <div className={cn(
        "absolute bottom-0 left-0 right-0 mx-auto h-[2px] scale-x-0 peer-focus:scale-x-100 transition-transform duration-300 ease-in-out",
        error ? "bg-error" : "bg-primary"
      )} />
      <label
        htmlFor={id}
        className={cn(
          `absolute left-0 cursor-text select-none
          transition-all duration-200 peer-placeholder-shown:top-4
          peer-placeholder-shown:text-lg
          md:peer-placeholder-shown:text-xl
          peer-[:not(:placeholder-shown)]:-top-0.5
          peer-[:not(:placeholder-shown)]:text-base
          peer-focus:-top-0.5 peer-focus:text-base`,
          error
            ? "text-error peer-[:not(:placeholder-shown)]:text-error peer-focus:text-error"
            : "text-text-muted peer-[:not(:placeholder-shown)]:text-primary peer-focus:text-primary"
        )}
      >
        {label}
      </label>
    </div>
  );
}
