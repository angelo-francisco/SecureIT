import type { InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

interface OutlinedInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: boolean;
}

export function OutlinedInput({ label, id, className, error, ...props }: OutlinedInputProps) {
  return (
    <div className="relative">
      <input
        id={id}
        className={cn(
          "peer w-full h-14 px-4 pt-2.5 pb-1.5 bg-transparent rounded-lg text-text text-base caret-primary",
          "placeholder-transparent focus:outline-none focus:ring-0 transition-colors",
          error
            ? "border-2 border-error focus:border-error caret-error"
            : "border border-border focus:border-primary",
          className
        )}
        placeholder=" "
        {...props}
      />
      <label
        htmlFor={id}
        className={cn(
          "absolute left-3 px-1 bg-bg cursor-text select-none transition-all duration-200",
          "peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base",
          "peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-xs",
          "peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs",
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
