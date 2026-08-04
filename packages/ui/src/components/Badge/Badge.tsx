import type { ReactNode } from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/cn";

export const badgeVariants = cva(
  "inline-flex items-center px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        primary: "bg-primary/15 text-primary border border-primary/25",
        success: "bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/25",
        warning: "bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/25",
        danger: "bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/25",
        info: "bg-[#3b82f6]/15 text-[#3b82f6] border border-[#3b82f6]/25",
        outline: "text-text-muted border border-border",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
);

export type BadgeVariant = "success" | "error" | "danger" | "warning" | "info" | "primary" | "outline";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

const variantMap: Record<BadgeVariant, "success" | "warning" | "danger" | "info" | "primary" | "outline"> = {
  success: "success",
  error: "danger",
  danger: "danger",
  warning: "warning",
  info: "info",
  primary: "primary",
  outline: "outline",
};

export function Badge({ variant = "info", children, className }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant: variantMap[variant] }), className)}>
      {children}
    </span>
  );
}
