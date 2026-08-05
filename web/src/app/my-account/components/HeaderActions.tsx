"use client";

import { Bell, Loader, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Modal } from "@/packages/ui";
import {
	type NotificationsResponse,
	NotificationsSection,
} from "./NotificationsSection";

export function HeaderActions() {
	const router = useRouter();
	const [notificationsOpen, setNotificationsOpen] = useState(false);
	const [notifications, setNotifications] =
		useState<NotificationsResponse | null>(null);
	const [loggingOut, setLoggingOut] = useState(false);

	const openNotifications = useCallback(() => {
		setNotificationsOpen(true);
		fetch("/api/notifications")
			.then((r) => (r.ok ? (r.json() as Promise<NotificationsResponse>) : null))
			.then((d) => {
				if (d) setNotifications(d);
			})
			.catch(() => { });
	}, []);

	const handleLogout = useCallback(async () => {
		setLoggingOut(true);
		try {
			await fetch("/api/auth/logout", { method: "POST" });
		} catch { }
		router.push("/login");
	}, [router]);

	return (
		<>
			<div className="flex items-center gap-2">
				<ThemeToggle />
				<button
					type="button"
					onClick={openNotifications}
					className="p-2.5 text-text-muted hover:text-primary transition-colors"
					aria-label="Notificações"
				>
					<Bell size={25} />
				</button>
				<button
					type="button"
					onClick={handleLogout}
					disabled={loggingOut}
					className="p-2.5 text-error flex gap-1 items-center disabled:opacity-50"
					aria-label="Sair"
				>
					{loggingOut ? (
						<Loader size={25} className="animate-spin" />
					) : (
						<LogOut size={25} />
					)}
				</button>
			</div>

			<Modal
				open={notificationsOpen}
				onClose={() => setNotificationsOpen(false)}
			>
				<div className="flex max-h-[70vh] w-[min(420px,calc(100vw-2rem))] flex-col border border-border bg-surface">
					<div className="flex items-center justify-between border-b border-border px-5 py-4">
						<span className="text-base font-bold uppercase tracking-wider text-text">
							Notificações
						</span>
					</div>
					<div className="overflow-y-auto p-4">
						<NotificationsSection data={notifications} />
					</div>
				</div>
			</Modal>
		</>
	);
}
