"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RevealOnScroll } from "@/components/animations/RevealOnScroll";
import { ParallaxLayer } from "@/components/animations/ParallaxLayer";
import { CountUp } from "@/components/animations/CountUp";
import { Marquee } from "@/components/animations/Marquee";
import {
	Shield,
	Eye,
	Bell,
	Phone,
	Laptop,
	Smartphone,
	Monitor,
	Fingerprint,
	Brain,
	Lock,
	Zap,
	ChevronRight,
	MessageCircle,
	Mail,
	ArrowRight,
	Quote,
} from "lucide-react";

const features = [
	{
		icon: Eye,
		title: "Reconhecimento Facial",
		description: "Identifique automaticamente pessoas conhecidas e desconhecidas com precisão de IA.",
	},
	{
		icon: Shield,
		title: "Deteção de Pessoas",
		description: "YOLOv11 detecta pessoas em tempo real com alta precisão e baixa latência.",
	},
	{
		icon: Bell,
		title: "Alertas em Tempo Real",
		description: "Notificações instantâneas quando alguém for detectado nas suas câmeras.",
	},
	{
		icon: Brain,
		title: "Análise de Comportamento",
		description: "Deteção de movimentos suspeitos com análise de fluxo óptico e fundo substractivo.",
	},
	{
		icon: Laptop,
		title: "Multi-Plataforma",
		description: "Desktop, web e mobile. Acesse de qualquer lugar, a qualquer momento.",
	},
	{
		icon: Lock,
		title: "Criptografia Avançada",
		description: "Dados protegidos com criptografia de ponta a ponta e assinaturas digitais.",
	},
];

const steps = [
	{
		num: "01",
		title: "Conecte",
		description: "Registe as suas câmeras em minutos. Suporte para RTSP, USB e IP com configuração automática.",
		icon: Zap,
	},
	{
		num: "02",
		title: "Monitore",
		description: "IA analisa cada frame em tempo real. Reconhecimento facial, deteção de pessoas e análise comportamental.",
		icon: Eye,
	},
	{
		num: "03",
		title: "Reaja",
		description: "Receba alertas instantânos no desktop, browser ou telemóvel. Responda a incidentes em segundos.",
		icon: Bell,
	},
];

const stats = [
	{ value: 12000, suffix: "+", label: "Câmeras conectadas" },
	{ value: 99.9, suffix: "%", label: "Uptime garantido", decimals: 1 },
	{ value: 2, suffix: "s", label: "Tempo de alerta", prefix: "<" },
	{ value: 3, suffix: "", label: "Plataformas" },
];

const testimonials = [
	{
		quote: "O SecureIT transformou a segurança do nosso edifício. O reconhecimento facial é incrivelmente preciso.",
		author: "Carlos Mendes",
		role: "Director de Operações, Hotel Continental",
	},
	{
		quote: "A multi-plataforma é um diferencial enorme. Monitorizo as câmeras do telemóvel quando estou fora.",
		author: "Ana Ferreira",
		role: "Proprietária, Residencial Aurora",
	},
	{
		quote: "A análise de comportamento detectou uma intrusão antes mesmo de alguém se aperceber. Impressionante.",
		author: "Miguel Santos",
		role: "Segurança Privada, Grupo AngoSafe",
	},
];

const trustLogos = [
	"Hotel Continental",
	"AngoSafe",
	"Residencial Aurora",
	"Grupo Imobiliar",
	"Condomínio Sol",
	"Edifício Central",
	"Parque Industrial",
	"Universidade Lusíada",
];

export default function HomePage() {
	return (
		<div className="min-h-screen">
			<Navbar />

			{/* ══════════════════════════════════════════
			    SECTION 1 — HERO (Parallax + Gradient)
			    ══════════════════════════════════════════ */}
			<section className="relative min-h-screen flex items-center overflow-hidden">
				<div className="absolute inset-0 bg-grid" />

				<ParallaxLayer speed="slow" className="absolute inset-0">
					<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(44,158,213,0.15)_0%,transparent_50%)]" />
					<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_80%,rgba(44,158,213,0.08)_0%,transparent_50%)]" />
				</ParallaxLayer>

				<ParallaxLayer className="absolute top-20 right-[10%] w-64 h-64 border border-primary/10 rotate-45 opacity-30" />
				<ParallaxLayer speed="slow" className="absolute bottom-32 left-[5%] w-40 h-40 border border-primary/10 rotate-12 opacity-20" />

				<div className="relative z-10 max-w-7xl mx-auto px-8 pt-32 pb-20 w-full">
					<div className="max-w-3xl">
						<div className="animate-hero-text" style={{ animationDelay: "100ms" }}>
							<div className="inline-flex items-center gap-2 px-3 py-1.5 border border-primary/25 bg-primary/10 mb-8">
								<span className="w-1.5 h-1.5 bg-primary rounded-full animate-glow" />
								<span className="text-xs font-semibold text-primary uppercase tracking-wider">
									Vigilância com Inteligência Artificial
								</span>
							</div>
						</div>

						<h1
							className="text-5xl sm:text-6xl lg:text-8xl font-extrabold leading-[0.95] tracking-tight animate-hero-text"
							style={{ animationDelay: "200ms" }}
						>
							A segurança mais
							<br />
							<span className="gradient-text">próxima de si.</span>
						</h1>

						<p
							className="mt-8 text-lg sm:text-xl text-text-muted max-w-xl leading-relaxed animate-hero-text"
							style={{ animationDelay: "350ms" }}
						>
							Sistema de monitorização inteligente multi-plataforma.
							Reconhecimento facial, deteção de pessoas e alertas em tempo real.
						</p>

						<div
							className="mt-10 flex flex-wrap gap-4 animate-hero-text"
							style={{ animationDelay: "500ms" }}
						>
							<a
								href="/signup"
								className="group inline-flex items-center gap-2 px-8 py-4 bg-primary text-white font-semibold text-sm hover:bg-primary-hover transition-all"
							>
								Começar Agora
								<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
							</a>
							<a
								href="/login"
								className="inline-flex items-center gap-2 px-8 py-4 border border-border text-text-muted font-medium text-sm hover:border-border-light hover:text-text transition-all"
							>
								Iniciar Sessão
							</a>
						</div>

						<div
							className="mt-16 flex items-center gap-8 animate-hero-text"
							style={{ animationDelay: "650ms" }}
						>
							<div className="flex items-center gap-2 text-xs text-text-muted">
								<div className="flex -space-x-2">
									{["#2C9ED5", "#22c55e", "#f59e0b", "#ef4444"].map((c) => (
										<div
											key={c}
											className="w-7 h-7 border-2 border-bg flex items-center justify-center text-[10px] font-bold text-white"
											style={{ background: c }}
										>
											{c === "#2C9ED5" ? "CM" : c === "#22c55e" ? "AF" : c === "#f59e0b" ? "MS" : "JR"}
										</div>
									))}
								</div>
								<span>120+ utilizadores activos</span>
							</div>
							<div className="h-4 w-[1px] bg-border" />
							<div className="flex items-center gap-1.5 text-xs text-text-muted">
								{[1, 2, 3, 4, 5].map((i) => (
									<svg key={i} className="w-3.5 h-3.5 text-primary fill-primary" viewBox="0 0 20 20">
										<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
									</svg>
								))}
								<span className="ml-1">4.9 / 5.0</span>
							</div>
						</div>
					</div>
				</div>

				<div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg to-transparent" />
			</section>

			{/* ══════════════════════════════════════════
			    SECTION 2 — TRUST BAR (Marquee)
			    ══════════════════════════════════════════ */}
			<section className="py-12 border-y border-border bg-surface/20">
				<p className="text-center text-xs font-semibold text-text-muted uppercase tracking-widest mb-8">
					Utilizado por empresas de referência
				</p>
				<Marquee speed={35} className="opacity-50">
					<div className="flex items-center gap-16 px-8">
						{trustLogos.map((name) => (
							<span key={name} className="text-sm font-semibold text-text-muted whitespace-nowrap tracking-wide uppercase">
								{name}
							</span>
						))}
					</div>
				</Marquee>
			</section>

			{/* ══════════════════════════════════════════
			    SECTION 3 — FEATURES (Scroll Reveal)
			    ══════════════════════════════════════════ */}
			<section id="features" className="py-32 px-8">
				<div className="max-w-7xl mx-auto">
					<RevealOnScroll>
						<div className="text-center mb-20">
							<p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">
								Funcionalidades
							</p>
							<h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
								Tudo o que precisa
								<br />
								<span className="text-text-muted">para ficar protegido</span>
							</h2>
						</div>
					</RevealOnScroll>

					<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
						{features.map((feature, i) => (
							<RevealOnScroll key={feature.title} delay={i * 80}>
								<div className="group p-10 bg-bg hover:bg-surface transition-colors duration-300 h-full">
									<div className="w-11 h-11 flex items-center justify-center border border-primary/25 bg-primary/10 mb-6">
										<feature.icon className="w-5 h-5 text-primary" />
									</div>
									<h3 className="text-lg font-bold text-text mb-3">{feature.title}</h3>
									<p className="text-sm text-text-muted leading-relaxed">{feature.description}</p>
								</div>
							</RevealOnScroll>
						))}
					</div>
				</div>
			</section>

			<div className="section-line max-w-7xl mx-auto" />

			{/* ══════════════════════════════════════════
			    SECTION 4 — HOW IT WORKS (Sticky Scroll)
			    ══════════════════════════════════════════ */}
			<section className="py-32 px-8 bg-surface/20">
				<div className="max-w-7xl mx-auto">
					<RevealOnScroll>
						<div className="text-center mb-20">
							<p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">
								Como funciona
							</p>
							<h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
								Três passos para
								<br />
								<span className="text-text-muted">uma segurança completa</span>
							</h2>
						</div>
					</RevealOnScroll>

					<div className="relative">
						<div className="absolute left-8 top-0 bottom-0 w-px bg-border hidden lg:block" />

						<div className="space-y-24">
							{steps.map((step, i) => (
								<RevealOnScroll key={step.num} variant="left" delay={i * 100}>
									<div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-16">
										<div className="shrink-0 relative z-10">
											<div className="w-16 h-16 flex items-center justify-center bg-bg border-2 border-primary text-primary font-extrabold text-lg">
												{step.num}
											</div>
										</div>
										<div className="card-sharp p-10 flex-1">
											<div className="flex items-center gap-3 mb-4">
												<step.icon className="w-5 h-5 text-primary" />
												<h3 className="text-2xl font-bold text-text">{step.title}</h3>
											</div>
											<p className="text-text-muted leading-relaxed max-w-lg">{step.description}</p>
										</div>
									</div>
								</RevealOnScroll>
							))}
						</div>
					</div>
				</div>
			</section>

			<div className="section-line max-w-7xl mx-auto" />

			{/* ══════════════════════════════════════════
			    SECTION 5 — STATS (CountUp)
			    ══════════════════════════════════════════ */}
			<section className="py-32 px-8">
				<div className="max-w-7xl mx-auto">
					<div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border">
						{stats.map((stat) => (
							<div key={stat.label} className="bg-bg p-10 text-center">
								<div className="text-4xl sm:text-5xl font-extrabold text-text mb-2">
									<CountUp
										end={stat.value}
										prefix={stat.prefix}
										suffix={stat.suffix}
										decimals={stat.decimals}
									/>
								</div>
								<p className="text-sm text-text-muted">{stat.label}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ══════════════════════════════════════════
			    SECTION 6 — PLATFORM (Parallax Layers)
			    ══════════════════════════════════════════ */}
			<section id="platform" className="relative py-32 px-8 overflow-hidden">
				<ParallaxLayer speed="slow" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(44,158,213,0.06)_0%,transparent_60%)]" />

				<div className="relative z-10 max-w-7xl mx-auto">
					<RevealOnScroll>
						<div className="text-center mb-20">
							<p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">
								Plataformas
							</p>
							<h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
								De qualquer dispositivo.
								<br />
								<span className="text-text-muted">Em qualquer lugar.</span>
							</h2>
						</div>
					</RevealOnScroll>

					<div className="grid md:grid-cols-3 gap-8">
						{[
							{
								icon: Monitor,
								title: "Desktop",
								description: "Aplicação nativa para Windows e Linux com processamento local de IA.",
								color: "primary",
								platform: "Windows · Linux",
							},
							{
								icon: Smartphone,
								title: "Mobile",
								description: "Aplicação móvel para iOS e Android com notificações push em tempo real.",
								color: "success",
								platform: "iOS · Android",
							},
							{
								icon: Laptop,
								title: "Web",
								description: "Painel de controlo completo no navegador, acessível de qualquer lugar.",
								color: "info",
								platform: "Chrome · Firefox · Safari",
							},
						].map((p, i) => (
							<RevealOnScroll key={p.title} variant="scale" delay={i * 120}>
								<div className="card-sharp p-8 text-center group">
									<div className={`w-14 h-14 mx-auto flex items-center justify-center border bg-${p.color}/10 border-${p.color}/25 mb-6`}>
										<p.icon className={`w-7 h-7 text-${p.color}`} />
									</div>
									<h3 className="text-xl font-bold text-text mb-2">{p.title}</h3>
									<p className="text-xs font-mono text-text-muted mb-4">{p.platform}</p>
									<p className="text-sm text-text-muted leading-relaxed">{p.description}</p>
								</div>
							</RevealOnScroll>
						))}
					</div>
				</div>
			</section>

			<div className="section-line max-w-7xl mx-auto" />

			{/* ══════════════════════════════════════════
			    SECTION 7 — TESTIMONIALS (Stagger)
			    ══════════════════════════════════════════ */}
			<section className="py-32 px-8 bg-surface/20">
				<div className="max-w-7xl mx-auto">
					<RevealOnScroll>
						<div className="text-center mb-20">
							<p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">
								Depoimentos
							</p>
							<h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
								O que dizem
								<br />
								<span className="text-text-muted">os nossos clientes</span>
							</h2>
						</div>
					</RevealOnScroll>

					<div className="grid md:grid-cols-3 gap-px bg-border">
						{testimonials.map((t, i) => (
							<RevealOnScroll key={t.author} delay={i * 120}>
								<div className="bg-bg p-10 h-full flex flex-col">
									<Quote className="w-8 h-8 text-primary/30 mb-6" />
									<p className="text-text leading-relaxed flex-1 mb-8">&ldquo;{t.quote}&rdquo;</p>
									<div>
										<p className="text-sm font-bold text-text">{t.author}</p>
										<p className="text-xs text-text-muted mt-1">{t.role}</p>
									</div>
								</div>
							</RevealOnScroll>
						))}
					</div>
				</div>
			</section>

			{/* ══════════════════════════════════════════
			    SECTION 8 — CTA + CONTACT
			    ══════════════════════════════════════════ */}
			<section id="contact" className="relative py-32 px-8 overflow-hidden">
				<ParallaxLayer speed="slow" className="absolute inset-0 bg-dots" />

				<div className="relative z-10 max-w-3xl mx-auto text-center">
					<RevealOnScroll variant="scale">
						<p className="text-xs font-semibold text-primary uppercase tracking-widest mb-6">
							Comece hoje
						</p>
						<h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
							Pronto para modernizar
							<br />
							a sua segurança?
						</h2>
						<p className="mt-6 text-lg text-text-muted max-w-lg mx-auto">
							Plataforma unificada para desktop, web e dispositivos móveis.
							Sem complexidade. Com inteligência artificial.
						</p>

						<div className="mt-10 flex flex-wrap items-center justify-center gap-4">
							<a
								href="/signup"
								className="group inline-flex items-center gap-2 px-8 py-4 bg-primary text-white font-semibold text-sm hover:bg-primary-hover transition-all"
							>
								Criar Conta Gratuita
								<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
							</a>
							<a
								href="/pricing"
								className="inline-flex items-center gap-2 px-8 py-4 border border-border text-text-muted font-medium text-sm hover:border-border-light hover:text-text transition-all"
							>
								Ver Planos
							</a>
						</div>

						<div className="mt-16 flex items-center justify-center gap-6">
							<a
								href="https://wa.me/244926422462"
								target="_blank"
								rel="noopener noreferrer"
								className="w-12 h-12 border border-border bg-surface/60 backdrop-blur-xl flex items-center justify-center hover:border-primary/40 hover:bg-primary/10 hover:-translate-y-1 transition-all"
							>
								<MessageCircle className="w-5 h-5 text-text-muted" />
							</a>
							<a
								href="mailto:newstatesofficial@gmail.com"
								className="w-12 h-12 border border-border bg-surface/60 backdrop-blur-xl flex items-center justify-center hover:border-primary/40 hover:bg-primary/10 hover:-translate-y-1 transition-all"
							>
								<Mail className="w-5 h-5 text-text-muted" />
							</a>
							<a
								href="tel:+244926422462"
								className="w-12 h-12 border border-border bg-surface/60 backdrop-blur-xl flex items-center justify-center hover:border-primary/40 hover:bg-primary/10 hover:-translate-y-1 transition-all"
							>
								<Phone className="w-5 h-5 text-text-muted" />
							</a>
						</div>
					</RevealOnScroll>
				</div>
			</section>

			<Footer />
		</div>
	);
}
