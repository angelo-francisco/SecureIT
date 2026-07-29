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
	{ value: 98, suffix: "%", label: "Uptime garantido" },
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

				<div className="relative w-full z-10 pt-32 pb-20 flex justify-center items-center flex-col">
					<h1
						className="text-5xl sm:text-6xl lg:text-8xl text-center font-extrabold leading-[0.95] animate-hero-text"
						style={{ animationDelay: "200ms" }}
					>
						A segurança mais
						<br />
						<span className="gradient-text">próxima de si.</span>
					</h1>

					<p
						className="mt-8 text-xl md:text-2xl text-center text-text-muted max-w-xl leading-relaxed animate-hero-text"
						style={{ animationDelay: "350ms" }}
					>
						Sistema de monitorização inteligente multi-plataforma.
					</p>

					<div
						className="mt-10 flex flex-wrap gap-4 animate-hero-text"
						style={{ animationDelay: "500ms" }}
					>
						<a
							href="/signup"
							className="text-xl group inline-flex items-center gap-2 px-8 py-4 bg-primary text-white font-semibold text-sm hover:bg-primary-hover transition-all"
						>
							Começar Agora
							<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
						</a>
					</div>
				</div>

				<div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg to-transparent" />
			</section>

			{/* <section className="py-12 border-y border-border bg-surface/20">
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
			</section> */}

			<section id="features" className="py-32 px-8">
				<div className="max-w-7xl mx-auto">
					<RevealOnScroll>
						<div className="text-center mb-20">
							<h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
								Tudo o que precisa para ficar protegido
							</h2>
						</div>
					</RevealOnScroll>

					<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
						{features.map((feature, i) => (
							<RevealOnScroll key={feature.title} delay={i * 80}>
								<div className="group p-10 bg-bg hover:bg-surface transition-colors duration-300 h-full">
									<div className="flex items-center justify-start gap-2 bg-primary/10 mb-3">
										<feature.icon className="w-6 h-6 text-primary" />
									<h3 className="text-xl font-bold text-text">{feature.title}</h3>
									</div>
									<p className="text-lg text-text-muted leading-relaxed">{feature.description}</p>
								</div>
							</RevealOnScroll>
						))}
					</div>
				</div>
			</section>

			<div className="section-line max-w-7xl mx-auto" />

			<section className="py-32 px-8 bg-surface/20">
				<div className="max-w-7xl mx-auto">
					<RevealOnScroll>
						<div className="text-center mb-16">
							<h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
								Três passos para
								<br />
								<span className="text-text-muted">uma segurança completa</span>
							</h2>
						</div>
					</RevealOnScroll>

					<div className="relative">
						<div className="absolute left-8 top-0 bottom-0 w-px bg-border hidden lg:block" />

						<div className="space-y-16">
							{steps.map((step, i) => (
								<RevealOnScroll key={step.num} variant="left" delay={i * 100}>
									<div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-16">
										<div className="shrink-0 relative z-10">
											<div className="w-16 h-16 flex items-center justify-center bg-bg border-2 border-primary text-primary font-extrabold text-lg">
												{step.num}
											</div>
										</div>
										<div className="card-sharp p-10 flex-1">
											<div className="flex items-center gap-3 mb-3">
												<step.icon className="w-6 h-6 text-primary" />
												<h3 className="text-2xl font-bold text-text">{step.title}</h3>
											</div>
											<p className="text-text-muted text-lg leading-relaxed">{step.description}</p>
										</div>
									</div>
								</RevealOnScroll>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* <section className="py-32 px-8 bg-surface/20">
				<div className="max-w-7xl mx-auto">
					<RevealOnScroll>
						<div className="text-center mb-20">
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
									<p className="text-text text-base leading-relaxed flex-1 mb-8">&ldquo;{t.quote}&rdquo;</p>
									<div>
										<p className="text-sm font-bold text-text">{t.author}</p>
										<p className="text-sm text-text-muted mt-1">{t.role}</p>
									</div>
								</div>
							</RevealOnScroll>
						))}
					</div>
				</div>
			</section> */}

			<section className="py-20 px-8 border-y border-border bg-surface/20">
				<div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
					{[
						{ value: 12000, suffix: "+", label: "Câmeras" },
						{ value: 120, suffix: "+", label: "Utilizadores" },
						{ value: 99.9, suffix: "%", label: "Uptime", decimals: 1 },
						{ value: 3, suffix: "", label: "Plataformas" },
					].map((stat) => (
						<div key={stat.label} className="bg-bg p-8 text-center">
							<div className="text-3xl font-extrabold text-text mb-1">
								<CountUp end={stat.value} suffix={stat.suffix} decimals={stat.decimals} />
							</div>
							<p className="text-xs text-text-muted">{stat.label}</p>
						</div>
					))}
				</div>
			</section>

			<section id="contact" className="relative py-32 px-8 overflow-hidden">
				<ParallaxLayer speed="slow" className="absolute inset-0 bg-dots" />

				<div className="relative z-10 max-w-3xl mx-auto text-center">
					<RevealOnScroll variant="scale">
						<h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
							Pronto para modernizar
							<br />
							a sua segurança?
						</h2>
						<p className="mt-6 text-2xl text-text-muted max-w-xl mx-auto">
							Plataforma unificada para desktop, web e dispositivos móveis.
							Sem complexidade. Com inteligência artificial.
						</p>

						<div className="mt-8 flex items-center justify-center gap-6">
							<a
								href="https://wa.me/244926422462"
								target="_blank"
								rel="noopener noreferrer"
								className="w-16 h-16 border border-border bg-surface/60 backdrop-blur-xl flex items-center justify-center hover:border-primary/40 hover:bg-primary/10 hover:-translate-y-1 transition-all"
							>
								<MessageCircle className="w-8 h-8 text-text-muted" />
							</a>
							<a
								href="mailto:newstatesofficial@gmail.com"
								className="w-16 h-16 border border-border bg-surface/60 backdrop-blur-xl flex items-center justify-center hover:border-primary/40 hover:bg-primary/10 hover:-translate-y-1 transition-all"
							>
								<Mail className="w-8 h-8 text-text-muted" />
							</a>
							<a
								href="tel:+244926422462"
								className="w-16 h-16 border border-border bg-surface/60 backdrop-blur-xl flex items-center justify-center hover:border-primary/40 hover:bg-primary/10 hover:-translate-y-1 transition-all"
							>
								<Phone className="w-8 h-8 text-text-muted" />
							</a>
						</div>
					</RevealOnScroll>
				</div>
			</section>

			<Footer />
		</div>
	);
}
