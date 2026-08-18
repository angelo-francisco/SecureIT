"use client";

import { CheckCheck } from "lucide-react";
import { forwardRef, useImperativeHandle, useState } from "react";
import { humanizePortugueseDate } from "@/lib/utils";

interface Notification {
	id: string;
	type: string;
	title: string;
	message: string;
	link: string | null;
	read: boolean;
	createdAt: string;
}

export interface NotificationsResponse {
	notifications: Notification[];
	unreadCount: number;
}

interface NotificationsSectionProps {
	data: NotificationsResponse | null;
}

export interface NotificationsSectionHandle {
	fetchData: () => Promise<NotificationsResponse | null>;
}

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
		<div className="flex max-h-[50vh] max-w-md flex-col border border-border bg-surface">
			<div className="flex items-center justify-between border-b border-border px-5 py-4">
				<span className="text-lg font-bold text-text">Notificações</span>
				{unreadCount > 0 && (
					<div className="flex justify-end">
						<button
							type="button"
							onClick={handleMarkAllRead}
							className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
						>
							<CheckCheck size={14} />
							Marcar todas como lidas
						</button>
					</div>
				)}
			</div>
			<div className="overflow-y-auto">
				{notifications.length === 0 ? (
					<div className="text-center py-8 text-text-muted">
						<p className="text-base md:text-lg">Nenhuma notificação</p>
					</div>
				) : (
					<div className="space-y-1 divide-y divide-gray-700">
						{notifications.map((n) => (
							<button
								type="button"
								key={n.id}
								onClick={() => !n.read && handleMarkAsRead(n.id)}
								className={`px-5 py-3 w-full text-left flex items-start gap-3 transition-colors ${
									!n.read ? "cursor-pointer" : "cursor-default"
								}`}
							>
								<div className="flex-1 min-w-0">
									<div className="flex items-center justify-between gap-2">
										<p className={`text-base font-medium`}>
											{n.title}
											{!n.read && (
												<span className="w-2 h-2 rounded-full bg-primary shrink-0" />
											)}
										</p>
										<p className="text-sm text-text-muted mt-1">
											{humanizePortugueseDate(new Date(n.createdAt))}
										</p>
									</div>
									<p className={`text-base mt-0.5`}>{n.message}</p>
								</div>
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
});

NotificationsSection.displayName = "NotificationsSection";
