import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";

type CalloutVariant = "info" | "warning" | "success" | "danger";

interface CalloutProps {
	variant?: CalloutVariant;
	title?: string;
	children: ReactNode;
}

const CONFIG: Record<
	CalloutVariant,
	{ icon: typeof Info; label: string; className: string; titleClass: string }
> = {
	info: {
		icon: Info,
		label: "Info",
		className: "border-primary/30 bg-primary/5",
		titleClass: "text-primary",
	},
	warning: {
		icon: AlertTriangle,
		label: "Atenção",
		className: "border-warning/30 bg-warning/5",
		titleClass: "text-warning",
	},
	success: {
		icon: CheckCircle2,
		label: "Sucesso",
		className: "border-success/30 bg-success/5",
		titleClass: "text-success",
	},
	danger: {
		icon: ShieldAlert,
		label: "Crítico",
		className: "border-error/30 bg-error/5",
		titleClass: "text-error",
	},
};

export function Callout({ variant = "info", title, children }: CalloutProps) {
	const { icon: Icon, className, titleClass } = CONFIG[variant];
	return (
		<div className={`my-6 border px-5 py-4 ${className}`}>
			<div className={`flex items-center gap-2 font-semibold ${titleClass}`}>
				<Icon className="h-5 w-5" />
				<span>{title ?? CONFIG[variant].label}</span>
			</div>
			<div className="mt-2 text-lg leading-relaxed text-text [&>p]:m-0">
				{children}
			</div>
		</div>
	);
}
