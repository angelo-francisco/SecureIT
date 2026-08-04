import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

type LabelSize = "sm" | "md" | "lg" | "xl";

const outlinedSizes: Record<LabelSize, { rest: string; focus: string }> = {
	sm: { rest: "text-xs", focus: "text-[0.625rem]" },
	md: { rest: "text-sm", focus: "text-xs" },
	lg: { rest: "text-base", focus: "text-sm" },
	xl: { rest: "text-lg", focus: "text-base" },
};

export interface OutlinedInputProps
	extends InputHTMLAttributes<HTMLInputElement> {
	label: string;
	id: string;
	error?: boolean;
	icon?: ReactNode;
	labelSize?: LabelSize;
}

export function OutlinedInput({
	label,
	id,
	className,
	error,
	icon,
	labelSize = "md",
	placeholder,
	...props
}: OutlinedInputProps) {
	const size = outlinedSizes[labelSize];

	return (
		<div className="relative">
			<input
				id={id}
				className={cn(
					"peer w-full h-14 pt-2.5 pb-1.5 bg-transparent text-text text-lg caret-primary",
					"placeholder-transparent focus:outline-none focus:ring-0 transition-colors",
					icon ? "pl-4 pr-11" : "px-4",
					error
						? "border-2 border-error focus:border-error caret-error"
						: "border border-border focus:border-primary",
					className,
				)}
				placeholder={placeholder ? placeholder : " "}
				{...props}
			/>
			<label
				htmlFor={id}
				className={cn(
					"absolute left-3 px-1 bg-bg cursor-text select-none truncate transition-all duration-200",
					"peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2",
					size.rest,
					"peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2",
					size.focus,
					"peer-focus:peer-placeholder-shown:text-sm peer-focus:text-sm peer-focus:top-0 peer-focus:-translate-y-1/2",
					icon && "max-w-[calc(100%-3.5rem)]",
					error
						? "text-error peer-[:not(:placeholder-shown)]:text-error peer-focus:text-error"
						: "text-text-muted peer-[:not(:placeholder-shown)]:text-primary peer-focus:text-primary",
				)}
			>
				{label}
			</label>
			{icon && (
				<span
					className={cn(
						"absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none [&_svg]:w-5 [&_svg]:h-5 shrink-0",
						error ? "text-error" : "text-text-muted",
					)}
				>
					{icon}
				</span>
			)}
		</div>
	);
}
