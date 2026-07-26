"use client";

import { useState, forwardRef, useImperativeHandle } from "react";
import { Bell, CheckCheck, ShieldCheck, ShieldX, Info } from "lucide-react";

interface Notification {
	id: string;
	type: string;
	title: string;
	message: string;
	link: string | null;
	read: boolean;
	createdAt: string;
}

interface NotificationsResponse {
	notifications: Notification[];
	unreadCount: number;
}

interface NotificationsSectionProps {
	data: NotificationsResponse | null;
}

export interface NotificationsSectionHandle {
	fetchData: () => Promise<NotificationsResponse | null>;
}

const TYPE_ICONS: Record<string, typeof Bell> = {
	LICENSE_APPROVED: ShieldCheck,
	LICENSE_REJECTED: ShieldX,
	PAYMENT_APPROVED: ShieldCheck,
	PAYMENT_REJECTED: ShieldX,
	GENERAL: Info,
};

const TYPE_COLORS: Record<string, string> = {
	LICENSE_APPROVED: "text-success",
	LICENSE_REJECTED: "text-error",
	PAYMENT_APPROVED: "text-success",
	PAYMENT_REJECTED: "text-error",
	GENERAL: "text-primary",
};

export const NotificationsSection = forwardRef<
	NotificationsSectionHandle,
	NotificationsSectionProps
>(({ data: initialData }, ref) => {
	const [response, setResponse] = useState<NotificationsResponse | null>(
		initialData,
	);

	useImperativeHandle(ref, () => ({
		fetchData: async () => {
			const res = await fetch("/api/notifications");
			if (res.ok) {
				const d = (await res.json()) as NotificationsResponse;
				setResponse(d);
				return d;
			}
			return null;
		},
	}));

	const handleMarkAsRead = async (id: string) => {
		await fetch(`/api/notifications/${id}/read`, { method: "PUT" });
		setResponse((prev) => {
			if (!prev) return prev;
			return {
				notifications: prev.notifications.map((n) =>
					n.id === id ? { ...n, read: true } : n,
				),
				unreadCount: Math.max(0, prev.unreadCount - 1),
			};
		});
	};

	const handleMarkAllRead = async () => {
		await fetch("/api/notifications/read-all", { method: "PUT" });
		setResponse((prev) => {
			if (!prev) return prev;
			return {
				notifications: prev.notifications.map((n) => ({ ...n, read: true })),
				unreadCount: 0,
			};
		});
	};

	const notifications = response?.notifications ?? [];
	const unreadCount = response?.unreadCount ?? 0;

	return (
		<div className="space-y-3">
			{unreadCount > 0 && (
				<div className="flex justify-end">
					<button
						onClick={handleMarkAllRead}
						className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
					>
						<CheckCheck size={14} />
						Marcar todas como lidas
					</button>
				</div>
			)}

			{notifications.length === 0 ? (
				<div className="text-center py-8 text-text-muted">
					<Bell size={40} className="text-primary mx-auto mb-3" />
					<p className="text-base md:text-lg">Nenhuma notificação</p>
				</div>
			) : (
				<div className="space-y-1">
					{notifications.map((n) => {
						const Icon = TYPE_ICONS[n.type] ?? Bell;
						const iconColor = TYPE_COLORS[n.type] ?? "text-text-muted";
						return (
							<button
								key={n.id}
								onClick={() => !n.read && handleMarkAsRead(n.id)}
								className={`w-full text-left flex items-start gap-3 p-3 rounded-lg transition-colors ${
									n.read
										? "hover:bg-surface-hover/50"
										: "bg-primary/5 hover:bg-primary/10"
								}`}
							>
								<div className={`mt-0.5 shrink-0 ${iconColor}`}>
									<Icon size={18} />
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										<p
											className={`text-sm font-medium ${n.read ? "text-text-muted" : "text-text"}`}
										>
											{n.title}
										</p>
										{!n.read && (
											<span className="w-2 h-2 rounded-full bg-primary shrink-0" />
										)}
									</div>
									<p
										className={`text-sm mt-0.5 ${n.read ? "text-text-muted" : "text-text/70"}`}
									>
										{n.message}
									</p>
									<p className="text-xs text-text-muted mt-1">
										{new Date(n.createdAt).toLocaleString("pt-PT")}
									</p>
								</div>
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
});

NotificationsSection.displayName = "NotificationsSection";
