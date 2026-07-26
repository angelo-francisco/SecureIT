import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 active:scale-[0.98]",
	{
		variants: {
			variant: {
				primary:
					"bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-hover",
				secondary: "bg-surface-hover text-text-muted hover:text-text",
				danger: "bg-error text-white hover:bg-error/90",
				ghost: "text-text-muted hover:text-text hover:bg-surface-hover",
				outline:
					"border border-border bg-transparent text-text hover:bg-surface-hover",
			},
			size: {
				sm: "h-9 px-4 text-xs",
				md: "h-10 px-5 text-sm",
				lg: "h-12 px-6 text-base",
				icon: "h-10 w-10",
			},
		},
		defaultVariants: {
			variant: "primary",
			size: "md",
		},
	},
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, ...props }, ref) => {
		return (
			<button
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				{...props}
			/>
		);
	},
);
Button.displayName = "Button";

export { Button, buttonVariants };
