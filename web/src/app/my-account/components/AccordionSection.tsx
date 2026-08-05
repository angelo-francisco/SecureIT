"use client";

import type { LucideIcon } from "lucide-react";
import { ChevronDown, Loader, RefreshCw } from "lucide-react";
import { type ReactNode, useState } from "react";

interface AccordionSectionProps {
	title: string;
	icon: LucideIcon;
	onOpen?: () => Promise<void>;
	onRefresh?: () => void;
	loading?: boolean;
	headerActions?: ReactNode;
	children: ReactNode;
}

export function AccordionSection({
	title,
	icon: Icon,
	onOpen,
	onRefresh,
	loading = false,
	headerActions,
	children,
}: AccordionSectionProps) {
	const [open, setOpen] = useState(false);
	const [opening, setOpening] = useState(false);

	const handleToggle = async () => {
		if (open) {
			setOpen(false);
			return;
		}
		if (onOpen) {
			setOpening(true);
			try {
				await onOpen();
			} catch {}
			setOpening(false);
			setOpen(true);
		} else {
			setOpen(true);
		}
	};

	return (
		<div className="bg-surface border border-border hover:border-primary/30 transition-colors overflow-hidden">
			<div className="flex items-center justify-between p-4 sm:p-5">
				<button
					type="button"
					onClick={handleToggle}
					disabled={opening}
					className="flex items-center gap-3.5 flex-1 text-left group"
				>
					<div className="w-10 h-10 border border-primary/30 bg-primary/10 flex items-center justify-center shrink-0 transition-colors group-hover:bg-primary/20 group-hover:border-primary/50">
						<Icon size={19} className="text-primary" />
					</div>
					<h3 className="text-base sm:text-lg font-bold text-text tracking-tight group-hover:text-primary transition-colors">
						{title}
					</h3>
				</button>

				<div className="flex items-center gap-1">
					{headerActions}
					{onRefresh && (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onRefresh();
							}}
							disabled={loading}
							className="p-2 border border-transparent hover:border-border text-text-muted hover:text-text hover:bg-surface-hover transition-all disabled:opacity-50"
							title="Atualizar"
						>
							<RefreshCw
								size={16}
								className={
									loading
										? "animate-spin"
										: "transition-transform hover:rotate-180 duration-500"
								}
							/>
						</button>
					)}
					{opening ? (
						<div className="p-2">
							<Loader size={18} className="text-primary animate-spin" />
						</div>
					) : (
						<button
							type="button"
							onClick={handleToggle}
							className="p-2 border border-transparent hover:border-border text-text-muted hover:text-text hover:bg-surface-hover transition-all"
						>
							<ChevronDown
								size={18}
								className={`transition-transform duration-300 ease-out ${
									open ? "rotate-180" : ""
								}`}
							/>
						</button>
					)}
				</div>
			</div>

			<div className="accordion-grid" data-open={open}>
				<div>
					<div className="border-t border-border p-4 sm:p-6 bg-bg/40">{children}</div>
				</div>
			</div>
		</div>
	);
}
