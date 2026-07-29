import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Mail, Phone } from "lucide-react";

const productLinks = [
	{ label: "Funcionalidades", href: "/#features" },
	{ label: "Licenças", href: "/pricing" },
	{ label: "Plataformas", href: "/#platform" },
	{ label: "Reconhecimento Facial", href: "/#features" },
];

const companyLinks = [
	{ label: "Contacto", href: "/#contact" },
	{ label: "Termos de Uso", href: "#" },
	{ label: "Política de Privacidade", href: "#" },
];

export function Footer() {
	return (
		<footer className="border-t border-border bg-surface/30">
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
