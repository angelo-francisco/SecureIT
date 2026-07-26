import Link from "next/link";
import { Shield, Eye, Bell, Phone, Mail, MessageCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { PricingSection } from "./components/PricingSection";

export default function HomePage() {
	return (
		<div className="min-h-screen">
			<Navbar />

			<section className="relative overflow-hidden min-h-screen flex justify-center items-center">
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,123,255,.15),transparent_60%)]" />

				<div className="max-w-7xl mx-auto px-8 py-20 w-full">
					<div>
						<h1 className="text-7xl font-bold leading-tight">
							A segurança mais
							<span className="text-primary"> próxima de si.</span>
							<br />
						</h1>

						<p className="mt-6 text-xl text-text-muted max-w-xl">
							Um sistema de monitorização inteligente multi-plataforma
						</p>

						<div className="mt-10 flex gap-4">
							<Link
								href="/signup"
								className="bg-primary px-6 py-4 rounded-xl font-semibold text-white hover:scale-105 transition"
							>
								Começar Agora
							</Link>

							<Link
								href="/login"
								className="border border-border px-6 py-4 rounded-xl"
							>
								Iniciar Sessão
							</Link>
						</div>
					</div>
				</div>
			</section>

			<section
				id="features"
				className="min-h-screen flex items-center justify-center px-8"
			>
				<div className="max-w-7xl mx-auto w-full">
					<div className="text-center mb-16">
						<h3 className="text-3xl font-bold text-text mb-4">
							Funcionalidades
						</h3>
						<p className="text-text-muted max-w-lg mx-auto">
							Tudo o que precisa para manter a sua casa segura
						</p>
					</div>
					<div className="grid md:grid-cols-3 gap-6">
						{[
							{
								icon: Eye,
								title: "Reconhecimento Facial",
								description:
									"Identifique automaticamente pessoas conhecidas e desconhecidas nas suas cameras.",
							},
							{
								icon: Shield,
								title: "Deteccao de Pessoas",
								description:
									"YOLOv11 detecta pessoas em tempo real com alta precisao e baixa latencia.",
							},
							{
								icon: Bell,
								title: "Alertas em Tempo Real",
								description:
									"Receba notificacoes instantaneas quando alguem for detectado nas suas cameras.",
							},
						].map((feature) => (
							<div
								key={feature.title}
								className="group p-8 rounded-2xl bg-surface border border-border hover:border-primary/30 transition-all duration-300"
							>
								<div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center mb-5">
									<feature.icon className="w-6 h-6 text-primary" />
								</div>
								<h4 className="text-xl font-semibold text-text mb-3">
									{feature.title}
								</h4>
								<p className="text-text-muted leading-relaxed">
									{feature.description}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			<PricingSection />
			<section className="py-32 text-center">
				<h2 className="text-5xl font-bold">
					Pronto para modernizar a sua segurança?
				</h2>

				<p className="mt-6 text-xl text-text-muted max-w-2xl mx-auto">
					Plataforma unificada para desktop, web e dispositivos móveis.
				</p>

				<div className="mt-14 flex items-center justify-center gap-4">
					<a
						href="https://wa.me/244926422462"
						target="_blank"
						className="
        w-14 h-14 rounded-2xl
        border border-border
        bg-surface/60 backdrop-blur-xl
        flex items-center justify-center
        hover:border-primary/40
        hover:bg-primary/10
        hover:-translate-y-1
        transition-all
      "
					>
						<MessageCircle className="w-5 h-5 text-text-muted hover:text-primary" />
					</a>

					<a
						href="mailto:newstatesofficial@gmail.com"
						className="
        w-14 h-14 rounded-2xl
        border border-border
        bg-surface/60 backdrop-blur-xl
        flex items-center justify-center
        hover:border-primary/40
        hover:bg-primary/10
        hover:-translate-y-1
        transition-all
      "
					>
						<Mail className="w-5 h-5 text-text-muted hover:text-primary" />
					</a>

					<a
						href="tel:+244926422462"
						className="
        w-14 h-14 rounded-2xl
        border border-border
        bg-surface/60 backdrop-blur-xl
        flex items-center justify-center
        hover:border-primary/40
        hover:bg-primary/10
        hover:-translate-y-1
        transition-all
      "
					>
						<Phone className="w-5 h-5 text-text-muted hover:text-primary" />
					</a>
				</div>
			</section>
			<footer className="border-t border-border py-12 px-8">
				<div className="max-w-7xl mx-auto flex items-center justify-between">
					<div className="flex items-center gap-2">
						<p className="text-text-muted text-sm">
							&copy; 2026 SecureIT. Todos os direitos reservados.
						</p>
					</div>
					<div className="flex items-center gap-6 text-sm text-text-muted">
						<a href="#" className="hover:text-text transition-colors">
							Termos
						</a>
						<a href="#" className="hover:text-text transition-colors">
							Privacidade
						</a>
					</div>
				</div>
			</footer>
		</div>
	);
}
