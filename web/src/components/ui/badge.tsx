import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
	"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
	{
		variants: {
			variant: {
				primary: "bg-primary/15 text-primary border border-primary/25",
				success: "bg-success/15 text-success border border-success/25",
				warning: "bg-warning/15 text-warning border border-warning/25",
				danger: "bg-error/15 text-error border border-error/25",
				info: "bg-info/15 text-info border border-info/25",
				outline: "text-text-muted border border-border",
			},
		},
		defaultVariants: {
			variant: "primary",
		},
	},
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
