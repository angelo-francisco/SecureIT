import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Mail, Phone } from "lucide-react";

const productLinks = [
	{ label: "Funcionalidades", href: "/#features" },
	{ label: "Preços", href: "/pricing" },
	{ label: "Plataformas", href: "/#platform" },
	{ label: "Reconhecimento Facial", href: "/#features" },
];

const companyLinks = [
	{ label: "Sobre Nós", href: "/about" },
	{ label: "Contacto", href: "/#contact" },
	{ label: "Termos de Uso", href: "#" },
	{ label: "Política de Privacidade", href: "#" },
];

export function Footer() {
	return (
		<footer className="border-t border-border bg-surface/30">
			<div className="max-w-7xl mx-auto px-8 py-16">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-12">
					<div className="md:col-span-1">
						<Link href="/" className="flex items-center gap-2 mb-4">
							<Image src="/logo.png" alt="SecureIT" width={32} height={32} className="h-6 w-auto" />
							<span className="text-lg font-bold text-text tracking-tight">SecureIT</span>
						</Link>
						<p className="text-sm text-text-muted leading-relaxed mb-6">
							Sistema de vigilância inteligente multi-plataforma para proteger o que mais importa.
						</p>
						<div className="flex gap-3">
							<a href="https://wa.me/244926422462" target="_blank" rel="noopener noreferrer" className="w-9 h-9 border border-border bg-surface flex items-center justify-center hover:border-primary/40 hover:bg-primary/10 transition-all">
								<MessageCircle className="w-4 h-4 text-text-muted" />
							</a>
							<a href="mailto:newstatesofficial@gmail.com" className="w-9 h-9 border border-border bg-surface flex items-center justify-center hover:border-primary/40 hover:bg-primary/10 transition-all">
								<Mail className="w-4 h-4 text-text-muted" />
							</a>
							<a href="tel:+244926422462" className="w-9 h-9 border border-border bg-surface flex items-center justify-center hover:border-primary/40 hover:bg-primary/10 transition-all">
								<Phone className="w-4 h-4 text-text-muted" />
							</a>
						</div>
					</div>

					<div>
						<h4 className="text-sm font-semibold text-text uppercase tracking-wider mb-4">Produto</h4>
						<ul className="space-y-3">
							{productLinks.map((link) => (
								<li key={link.label}>
									<Link href={link.href} className="text-sm text-text-muted hover:text-text transition-colors">
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					<div>
						<h4 className="text-sm font-semibold text-text uppercase tracking-wider mb-4">Empresa</h4>
						<ul className="space-y-3">
							{companyLinks.map((link) => (
								<li key={link.label}>
									<Link href={link.href} className="text-sm text-text-muted hover:text-text transition-colors">
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					<div>
						<h4 className="text-sm font-semibold text-text uppercase tracking-wider mb-4">Plataformas</h4>
						<ul className="space-y-3 text-sm text-text-muted">
							<li className="flex items-center gap-2">
								<span className="w-1.5 h-1.5 bg-primary rounded-full" />
								Desktop (Windows / Linux)
							</li>
							<li className="flex items-center gap-2">
								<span className="w-1.5 h-1.5 bg-success rounded-full" />
								Web (Navegador)
							</li>
							<li className="flex items-center gap-2">
								<span className="w-1.5 h-1.5 bg-info rounded-full" />
								Mobile (iOS / Android)
							</li>
						</ul>
					</div>
				</div>
			</div>

			<div className="border-t border-border">
				<div className="max-w-7xl mx-auto px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
					<p className="text-xs text-text-muted">
						&copy; {new Date().getFullYear()} SecureIT. Todos os direitos reservados.
					</p>
					<div className="flex items-center gap-6 text-xs text-text-muted">
						<Link href="#" className="hover:text-text transition-colors">Termos</Link>
						<Link href="#" className="hover:text-text transition-colors">Privacidade</Link>
						<Link href="#" className="hover:text-text transition-colors">Cookies</Link>
					</div>
				</div>
			</div>
		</footer>
	);
}
