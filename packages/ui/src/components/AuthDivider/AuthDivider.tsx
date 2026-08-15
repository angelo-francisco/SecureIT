import { cn } from "../../lib/cn";

interface AuthDividerProps {
	label?: string;
	className?: string;
}

export function AuthDivider({
	label = "ou",
	className = "",
}: AuthDividerProps) {
	return (
		<div className={cn("flex items-center gap-4", className)}>
			<div className="h-px flex-1 bg-border" />
			<span className="text-base text-text-muted">{label}</span>
			<div className="h-px flex-1 bg-border" />
		</div>
	);
}
