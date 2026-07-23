import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

type LabelSize = "sm" | "md" | "lg" | "xl";

const floatingSizes: Record<LabelSize, { rest: string; focus: string }> = {
  sm: { rest: "text-sm", focus: "text-xs" },
  md: { rest: "text-base", focus: "text-sm" },
  lg: { rest: "text-lg md:text-xl", focus: "text-base" },
  xl: { rest: "text-xl md:text-2xl", focus: "text-lg" },
};

export interface FloatingLabelInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: boolean;
  icon?: ReactNode;
  labelSize?: LabelSize;
}

export function FloatingLabelInput({ label, id, className, error, icon, labelSize = "lg", ...props }: FloatingLabelInputProps) {
  const size = floatingSizes[labelSize];

  return (
    <div className="relative overflow-hidden">
      <input
        id={id}
        className={cn(
          "peer w-full border-0 bg-transparent pt-5 pb-1.5 text-lg md:text-xl text-text placeholder-transparent caret-primary",
          "focus:outline-none focus:ring-0 transition-colors",
          icon ? "pl-0 pr-7" : "px-0",
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
          "absolute left-0 right-0 cursor-text select-none truncate transition-all duration-200",
          "peer-placeholder-shown:top-4",
          size.rest,
          "peer-[:not(:placeholder-shown)]:-top-0.5",
          size.focus,
          "peer-focus:peer-placeholder-shown:text-base",
          size.focus,
          "peer-focus:-top-0.5",
          error
            ? "text-error peer-[:not(:placeholder-shown)]:text-error peer-focus:text-error"
            : "text-text-muted peer-[:not(:placeholder-shown)]:text-primary peer-focus:text-primary"
        )}
      >
        {label}
      </label>
      {icon && (
        <span className={cn(
          "absolute right-0 top-4 -translate-y-px pointer-events-none [&_svg]:w-5 [&_svg]:h-5 shrink-0",
          error ? "text-error" : "text-text-muted"
        )}>
          {icon}
        </span>
      )}
    </div>
  );
}
