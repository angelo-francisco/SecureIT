import type { ButtonHTMLAttributes, ReactNode } from "react";
import { buttonVariants } from "../components/ui/button";
import { cn } from "../lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  icon?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  icon,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
}
