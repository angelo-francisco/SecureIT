import type { SelectHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
	options: { value: string; label: string }[];
}

export function Select({ options, className, ...props }: SelectProps) {
	return (
		<select
			className={cn(
				"h-12 w-full border border-border bg-surface px-4 py-2 text-sm text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-colors appearance-none",
				className,
			)}
			{...props}
		>
			{options.map((opt) => (
				<option key={opt.value} value={opt.value}>
					{opt.label}
				</option>
			))}
		</select>
	);
}
