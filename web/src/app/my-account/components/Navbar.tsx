"use client";

import {
	Bell,
	Download,
	FileText,
	Home,
	Key,
	Loader,
	LogOut,
	Menu,
	X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Modal } from "@/packages/ui";
import { NewLicenseModal } from "./NewLicenseModal";
import { DownloadModal } from "./DownloadModal";
import {
	type NotificationsResponse,
	NotificationsSection,
} from "./NotificationsSection";

export function Navbar() {
	const router = useRouter();
	const [mobileOpen, setMobileOpen] = useState(false);
	const [plansModalOpen, setPlansModalOpen] = useState(false);
	const [notificationsOpen, setNotificationsOpen] = useState(false);
	const [downloadOpen, setDownloadOpen] = useState(false);
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
			.catch(() => {});
	}, []);

	const handleLogout = useCallback(async () => {
		setLoggingOut(true);
		try {
			await fetch("/api/auth/logout", { method: "POST" });
		} catch {}
		router.push("/login");
	}, [router]);

	const scrollToPlans = useCallback(() => {
		setPlansModalOpen(true);
	}, []);

	const navLinks = [
		{ label: "Início", href: "/my-account", icon: Home },
		{ label: "Documentação", href: "/docs", icon: FileText },
		{
			label: "Obter licença",
			href: "obtain-license",
			icon: Key,
			onClick: scrollToPlans,
		},
	];

	const LogoutButton = ({ complet = false }: { complet?: boolean }) => {
		if (complet)
			return (
				<button
					type="button"
					onClick={handleLogout}
					disabled={loggingOut}
					className="p-2.5 bg-error text-white text-lg font-bold w-full flex gap-1 justify-center items-center disabled:opacity-50"
					aria-label="Sair"
				>
					{loggingOut ? (
						<>
							<Loader size={20} className="animate-spin" />
							Saindo...
						</>
					) : (
						<>
							<LogOut size={20} />
							Terminar Sessão
						</>
					)}
				</button>
			);
		return (
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
		);
	};

	const NotificationsButton = () => (
		<button
			type="button"
			onClick={openNotifications}
			className="p-2.5 text-text-muted hover:text-primary transition-colors"
			aria-label="Notificações"
		>
			<Bell size={25} />
		</button>
	);

	return (
		<nav className="z-50 transition-all duration-300 bg-bg/80 backdrop-blur-xl border-b border-border">
			<div className="w-full mx-auto px-6 md:px-8 py-4 flex items-center justify-between">
				<Link href="/" className="flex items-center gap-2.5 shrink-0">
					<Image
						src="/logo.png"
						alt="SecureIT"
						width={30}
						height={30}
						className="h-9 w-auto"
					/>
					<span className="text-3xl font-bold text-text tracking-tight">
						SecureIT
					</span>
				</Link>

				<div className="hidden md:flex items-center gap-3">
					{navLinks.map((link) => {
						if (link.onClick)
							return (
								<button
									key={link.href}
									type="button"
									onClick={link.onClick}
									className="flex items-center justify-center gap-2 px-4 py-2 text-lg font-bold text-text-muted hover:text-text border border-transparent hover:border-border transition-colors"
								>
									<link.icon size={20} />
									{link.label}
								</button>
							);
						return (
							<Link
								key={link.href}
								href={link.href}
								className="flex items-center justify-center gap-2 px-4 py-2 text-lg font-bold text-text-muted hover:text-text border border-transparent hover:border-border transition-colors"
							>
								<link.icon size={20} />
								{link.label}
							</Link>
						);
					})}
				</div>

				<div className="hidden md:flex items-center gap-3">
					<ThemeToggle />
					<button
						type="button"
						onClick={() => setDownloadOpen(true)}
						className="p-2.5 text-text-muted hover:text-primary transition-colors"
						aria-label="Descarregar"
					>
						<Download size={25} />
					</button>
					<NotificationsButton />
					<LogoutButton />
				</div>

				<div className="flex md:hidden items-center gap-2">
					<ThemeToggle />
					<button
						type="button"
						onClick={() => setDownloadOpen(true)}
						className="p-2.5 text-text-muted hover:text-primary transition-colors"
						aria-label="Descarregar"
					>
						<Download size={25} />
					</button>
					<NotificationsButton />
					<button
						type="button"
						onClick={() => setMobileOpen(!mobileOpen)}
						className="p-2 text-text-muted hover:text-text"
					>
						{mobileOpen ? <X size={24} /> : <Menu size={24} />}
					</button>
				</div>
			</div>

			{mobileOpen && (
				<div className="md:hidden bg-surface border-b border-border animate-slide-in-up">
					<div className="px-6 py-4 space-y-1">
						{navLinks.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								onClick={() => setMobileOpen(false)}
								className="flex items-center justify-left gap-2 p-3 text-lg font-bold text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
							>
								<link.icon size={20} />
								{link.label}
							</Link>
						))}
						<div className="pt-3 border-t border-border space-y-2">
							<LogoutButton complet={true} />
						</div>
					</div>
				</div>
			)}

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

			<NewLicenseModal
				open={plansModalOpen}
				onClose={() => setPlansModalOpen(false)}
			/>

			<DownloadModal
				open={downloadOpen}
				onClose={() => setDownloadOpen(false)}
			/>
		</nav>
	);
}
