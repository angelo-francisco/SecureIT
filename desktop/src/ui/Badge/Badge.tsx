import type { ReactNode } from "react";
import { badgeVariants } from "../components/ui/badge";
import { cn } from "../lib/utils";

interface BadgeProps {
  variant?: "success" | "error" | "warning" | "info" | "primary" | "outline";
  children: ReactNode;
  className?: string;
}

const variantMap: Record<string, "success" | "warning" | "danger" | "info" | "primary" | "outline"> = {
  success: "success",
  error: "danger",
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
