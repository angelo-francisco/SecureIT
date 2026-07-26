import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
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

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
