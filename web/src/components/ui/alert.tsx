import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

interface AlertProps {
	variant?: "error" | "success" | "warning" | "info";
	children: React.ReactNode;
	className?: string;
}

export function Alert({ variant = "error", children, className }: AlertProps) {
	const styles = {
		error: "bg-error/10 border-error/20 text-error",
		success: "bg-success/10 border-success/20 text-success",
		warning: "bg-warning/10 border-warning/20 text-warning",
		info: "bg-info/10 border-info/20 text-info",
	};

	return (
		<div
			className={cn(
				"flex items-center gap-2 p-3 rounded-lg border text-sm text-center",
				styles[variant],
				className,
			)}
		>
			<AlertCircle className="h-4 w-4 shrink-0" />
			<span>{children}</span>
		</div>
	);
}
