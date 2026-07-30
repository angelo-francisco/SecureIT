"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { Menu, X, User } from "lucide-react";

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
		return (
			<nav className="relative top-0 z-50 py-6">
				<div className="px-4 flex items-center justify-between">
					<div className="flex gap-2 justify-center items-center">
						<Link
							href="/"
							className="flex items-center gap-2.5 transition-colors"
						>
							<Image
								src="/logo.png"
								alt="SecureIT"
								width={40}
								height={40}
								className="h-6 md:h-8 w-auto"
							/>
							<h1 className="text-2xl md:text-3xl font-bold leading-10 text-text tracking-tight">
								SecureIT
							</h1>
						</Link>
						<div className="min-h-8 w-[1px] bg-gray-300" />
						<h1 className="font-bold text-2xl md:text-3xl">Minha Conta</h1>
					</div>
				</div>
			</nav>
		);
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
