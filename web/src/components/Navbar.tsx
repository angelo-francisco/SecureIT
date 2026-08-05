"use client";

import {
	Bell,
	ChevronDown,
	CreditCard,
	Headset,
	Loader,
	LogOut,
	Mail,
	Menu,
	Phone,
	User,
	X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

const navLinks = [
	{ label: "Início", href: "/#home" },
	{ label: "Sobre Nós", href: "/#about" },
	{ label: "Funcionalidades", href: "/#features" },
	{ label: "Licenças", href: "/pricing" },
	{ label: "Contacto", href: "/#contact" },
];

export function Navbar({
	inMyAccount = false,
	minimal = false,
}: {
	inMyAccount?: boolean;
	minimal?: boolean;
}) {
	const [scrolled, setScrolled] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 20);
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	if (minimal) {
		return (
			<nav className="relative top-0 z-50 py-6 px-4 md:px-6">
				<div className="flex items-center">
					<Link href="/" className="flex items-center gap-2.5">
						<Image
							src="/logo.png"
							alt="SecureIT"
							width={40}
							height={40}
							className="h-8 w-auto"
						/>
						<span className="text-3xl font-bold text-text tracking-tight">
							SecureIT
						</span>
					</Link>
				</div>
			</nav>
		);
	}

	if (inMyAccount) {
		return <MyAccountNavbar />;
	}

	return (
		<nav
			className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
				scrolled
					? "bg-bg/80 backdrop-blur-xl border-b border-border"
					: "bg-transparent"
			}`}
		>
			<div className="w-full mx-auto px-6 md:px-8 py-4 flex items-center justify-between">
				<Link href="/" className="flex items-center gap-2.5 shrink-0">
					<Image
						src="/logo.png"
						alt="SecureIT"
						width={40}
						height={40}
						className="h-9 w-auto"
					/>
					<span className="text-4xl font-bold text-text tracking-tight">
						SecureIT
					</span>
				</Link>

				<div className="hidden md:flex items-center gap-1">
					{navLinks.map((link) => (
						<Link
							key={link.href}
							href={link.href}
							className="px-4 py-2.5 text-xl font-medium text-text hover:bg-bg hover:border transition-colors"
						>
							{link.label}
						</Link>
					))}
				</div>

				<div className="hidden md:flex items-center gap-3">
					<ThemeToggle />
					<Link
						href="/login"
						className="flex items-center gap-1 px-5 py-2.5 text-xl font-medium text-text-muted hover:text-text border border-border hover:border-border-light transition-all"
					>
						<User className="w-4 h-4" />
						Entrar
					</Link>
				</div>

				<div className="flex md:hidden items-center gap-2">
					<ThemeToggle />
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
								className="block px-3 py-3 text-sm font-medium text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
							>
								{link.label}
							</Link>
						))}
						<div className="pt-3 border-t border-border space-y-2">
							<Link
								href="/login"
								onClick={() => setMobileOpen(false)}
								className="block text-center py-3 text-sm font-medium text-text-muted border border-border hover:bg-surface-hover transition-colors"
							>
								Iniciar Sessão
							</Link>
							<Link
								href="/signup"
								onClick={() => setMobileOpen(false)}
								className="block text-center py-3 text-sm font-semibold text-white bg-primary hover:bg-primary-hover transition-colors"
							>
								Começar Agora
							</Link>
						</div>
					</div>
				</div>
			)}
		</nav>
	);
}

interface NotificationItem {
	id: string;
	title: string;
	message: string;
	read: boolean;
	createdAt: string;
}

function MyAccountNavbar() {
	const router = useRouter();
	const [mobileOpen, setMobileOpen] = useState(false);
	const [supportOpen, setSupportOpen] = useState(false);
	const [notifOpen, setNotifOpen] = useState(false);
	const [notifications, setNotifications] = useState<NotificationItem[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [loggingOut, setLoggingOut] = useState(false);

	const supportRef = useRef<HTMLDivElement>(null);
	const notifRef = useRef<HTMLDivElement>(null);

	const fetchNotifications = useCallback(() => {
		fetch("/api/notifications")
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => {
				if (data) {
					setNotifications(data.notifications || []);
					setUnreadCount(data.unreadCount || 0);
				}
			})
			.catch(() => {});
	}, []);

	useEffect(() => {
		fetchNotifications();
	}, [fetchNotifications]);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				supportRef.current &&
				!supportRef.current.contains(e.target as Node)
			) {
				setSupportOpen(false);
			}
			if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
				setNotifOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleLogout = async () => {
		setLoggingOut(true);
		await fetch("/api/auth/logout", { method: "POST" });
		router.push("/login");
	};

	const handleOpenPlans = () => {
		window.dispatchEvent(new CustomEvent("open-plans-modal"));
		setMobileOpen(false);
	};

	const handleOpenNotifications = () => {
		window.dispatchEvent(new CustomEvent("open-notifications"));
		setNotifOpen((v) => !v);
	};

	return (
		<nav className="sticky top-0 z-50 bg-bg/95 backdrop-blur-md border-b border-border transition-all">
			<div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
				{/* Brand */}
				<div className="flex items-center gap-3">
					<Link
						href="/"
						className="flex items-center gap-2.5 transition-colors hover:opacity-90"
					>
						<Image
							src="/logo.png"
							alt="SecureIT"
							width={40}
							height={40}
							className="h-7 sm:h-9 w-auto"
						/>
						<span className="text-xl sm:text-2xl font-bold text-text tracking-tight font-display">
							SecureIT
						</span>
					</Link>
					<span className="hidden sm:inline-block w-px h-5 bg-border mx-1" />
					<span className="hidden sm:inline-flex items-center px-2.5 py-1 text-xs font-mono font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/30">
						Minha Conta
					</span>
				</div>

				{/* Desktop Actions */}
				<div className="hidden md:flex items-center gap-2">
					{/* Obter Licença Button */}
					<button
						type="button"
						onClick={handleOpenPlans}
						className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white font-bold text-sm transition-all cursor-pointer shadow-sm"
					>
						<CreditCard size={17} />
						<span>Obter Licença</span>
					</button>

					{/* Notifications Dropdown */}
					<div className="relative" ref={notifRef}>
						<button
							type="button"
							onClick={handleOpenNotifications}
							className="relative px-3 py-2 text-text-muted hover:text-text hover:bg-surface transition-all cursor-pointer flex items-center gap-1.5 text-sm font-medium"
							title="Notificações"
						>
							<Bell size={18} />
							<span className="hidden lg:inline">Notificações</span>
							{unreadCount > 0 && (
								<span className="px-1.5 py-0.2 text-[10px] font-mono font-bold bg-error text-white">
									{unreadCount}
								</span>
							)}
						</button>

						{notifOpen && (
							<div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface border border-border shadow-xl p-4 z-50 animate-slide-up">
								<div className="flex items-center justify-between pb-3 border-b border-border mb-3">
									<div className="flex items-center gap-2">
										<Bell size={17} className="text-primary" />
										<h4 className="font-bold text-text text-sm">
											Notificações
										</h4>
									</div>
									{unreadCount > 0 && (
										<span className="text-xs font-mono font-semibold px-2 py-0.5 bg-primary/10 text-primary">
											{unreadCount} não lidas
										</span>
									)}
								</div>

								{notifications.length === 0 ? (
									<p className="text-xs text-text-muted text-center py-6">
										Nenhuma notificação recente.
									</p>
								) : (
									<div className="max-h-64 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
										{notifications.slice(0, 5).map((n) => (
											<div
												key={n.id}
												className={`p-3 text-xs transition-colors ${
													n.read
														? "bg-bg/40 text-text-muted"
														: "bg-surface-hover text-text"
												}`}
											>
												<p className="font-bold text-text">{n.title}</p>
												<p className="mt-1 text-text-muted leading-relaxed">
													{n.message}
												</p>
											</div>
										))}
									</div>
								)}
							</div>
						)}
					</div>

					{/* Support Dropdown */}
					<div className="relative" ref={supportRef}>
						<button
							type="button"
							onClick={() => setSupportOpen((v) => !v)}
							className="flex items-center gap-1.5 px-3 py-2 text-text-muted hover:text-text hover:bg-surface transition-all cursor-pointer font-medium text-sm"
						>
							<Headset size={18} />
							<span>Apoio</span>
							<ChevronDown
								size={14}
								className={`transition-transform duration-200 ${
									supportOpen ? "rotate-180" : ""
								}`}
							/>
						</button>

						{supportOpen && (
							<div className="absolute right-0 mt-2 w-60 bg-surface border border-border shadow-xl py-1 z-50 animate-slide-up">
								<a
									href="https://wa.me/244926422462"
									target="_blank"
									rel="noopener noreferrer"
									onClick={() => setSupportOpen(false)}
									className="flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-text hover:bg-surface-hover transition-colors border-b border-border/60"
								>
									<svg
										viewBox="0 0 24 24"
										width={16}
										height={16}
										fill="#25D366"
										aria-hidden="true"
									>
										<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
									</svg>
									WhatsApp Support
								</a>
								<a
									href="tel:+244926422462"
									onClick={() => setSupportOpen(false)}
									className="flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-text hover:bg-surface-hover transition-colors border-b border-border/60"
								>
									<Phone size={15} className="text-primary shrink-0" />
									+244 926 422 462
								</a>
								<a
									href="mailto:newstatesofficial@gmail.com"
									onClick={() => setSupportOpen(false)}
									className="flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-text hover:bg-surface-hover transition-colors"
								>
									<Mail size={15} className="text-blue-500 shrink-0" />
									Email Support
								</a>
							</div>
						)}
					</div>

					{/* Theme Toggle */}
					<div className="p-2 hover:bg-surface transition-all">
						<ThemeToggle />
					</div>

					<div className="w-px h-5 bg-border mx-1" />

					{/* Logout Button */}
					<button
						type="button"
						onClick={handleLogout}
						disabled={loggingOut}
						className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-error hover:bg-error/10 transition-all cursor-pointer disabled:opacity-50"
					>
						{loggingOut ? (
							<Loader size={16} className="animate-spin" />
						) : (
							<LogOut size={16} />
						)}
						<span>Fechar Sessão</span>
					</button>
				</div>

				{/* Mobile Toggle */}
				<div className="flex md:hidden items-center gap-2">
					<div className="p-1.5 bg-surface border border-border">
						<ThemeToggle />
					</div>
					<button
						type="button"
						onClick={() => setMobileOpen(!mobileOpen)}
						className="p-2 text-text-muted hover:text-text bg-surface border border-border transition-colors"
					>
						{mobileOpen ? <X size={22} /> : <Menu size={22} />}
					</button>
				</div>
			</div>

			{/* Mobile Menu */}
			{mobileOpen && (
				<div className="md:hidden bg-surface border-b border-border px-4 py-4 space-y-3 animate-slide-up">
					<button
						type="button"
						onClick={handleOpenPlans}
						className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-primary hover:bg-primary-hover text-white font-bold text-sm border border-primary-hover shadow-sm"
					>
						<CreditCard size={18} />
						<span>Obter Licença</span>
					</button>

					<button
						type="button"
						onClick={handleOpenNotifications}
						className="w-full flex items-center justify-between px-4 py-2.5 bg-bg border border-border text-sm font-medium text-text"
					>
						<div className="flex items-center gap-2">
							<Bell size={18} className="text-primary" />
							<span>Notificações</span>
						</div>
						{unreadCount > 0 && (
							<span className="px-2 py-0.5 text-xs font-mono font-semibold bg-error text-white">
								{unreadCount} não lidas
							</span>
						)}
					</button>

					<div className="pt-2 border-t border-border space-y-2">
						<p className="text-xs font-mono font-semibold text-text-muted uppercase tracking-wider px-1">
							Apoio ao Cliente
						</p>
						<a
							href="https://wa.me/244926422462"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-text border border-border hover:bg-bg"
						>
							<span className="text-emerald-500 font-semibold">
								WhatsApp (+244 926 422 462)
							</span>
						</a>
						<a
							href="mailto:newstatesofficial@gmail.com"
							className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-text border border-border hover:bg-bg"
						>
							<span>Email Support</span>
						</a>
					</div>

					<div className="pt-2 border-t border-border">
						<button
							type="button"
							onClick={handleLogout}
							disabled={loggingOut}
							className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-error bg-error/10 hover:bg-error/20 border border-error/30 text-xs font-semibold transition-colors"
						>
							{loggingOut ? (
								<Loader size={16} className="animate-spin" />
							) : (
								<LogOut size={16} />
							)}
							<span>Fechar Sessão</span>
						</button>
					</div>
				</div>
			)}
		</nav>
	);
}
