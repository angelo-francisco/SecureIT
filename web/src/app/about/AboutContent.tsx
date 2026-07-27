"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RevealOnScroll } from "@/components/animations/RevealOnScroll";
import { ParallaxLayer } from "@/components/animations/ParallaxLayer";
import { CountUp } from "@/components/animations/CountUp";
import {
	Shield,
	Eye,
	Users,
	Globe,
	Lock,
	Rocket,
	Target,
	Heart,
} from "lucide-react";

const values = [
	{
		icon: Shield,
		title: "Segurança Primeiro",
		description: "Cada decisão técnica é tomada com a segurança dos nossos utilizadores em mente.",
	},
	{
		icon: Target,
		title: "Precisão de IA",
		description: "Utilizamos modelos de ponta — YOLOv11, FaceNet — para máxima fiabilidade.",
	},
	{
		icon: Globe,
		title: "Acessibilidade",
		description: "Multi-plataforma para que ninguém fique fora. Desktop, web e mobile.",
	},
	{
		icon: Heart,
		title: "Paixão por Inovação",
		description: "Estamos sempre a evoluir, trazendo novas capacidades constantemente.",
	},
];

const milestones = [
	{ year: "2024", title: "Fundação", description: "SecureIT nasce com a visão de democratizar a segurança inteligente em Angola." },
	{ year: "2025", title: "Beta Público", description: "Lançamento da versão beta com reconhecimento facial e deteção de pessoas." },
	{ year: "2025", title: "Multi-Plataforma", description: "Expansão para desktop, web e mobile com sincronização em tempo real." },
	{ year: "2026", title: "Análise Comportamental", description: "Integração de análise de comportamento com fluxo óptico e deteção de anomalias." },
	{ year: "2026", title: "Actual", description: "Plataforma completa com 12.000+ câmeras conectadas e 120+ utilizadores activos." },
];

export function AboutContent() {
	return (
		<div className="min-h-screen">
			<Navbar />

			{/* Hero */}
			<section className="relative min-h-[70vh] flex items-center overflow-hidden pt-24">
				<div className="absolute inset-0 bg-grid" />
				<ParallaxLayer speed="slow" className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(44,158,213,0.12)_0%,transparent_60%)]" />

				<div className="relative z-10 max-w-7xl mx-auto px-8 py-20 w-full">
					<RevealOnScroll>
						<p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">
							Sobre Nós
						</p>
						<h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[0.95]">
							Proteger o que
							<br />
							<span className="gradient-text">mais importa.</span>
						</h1>
						<p className="mt-6 text-lg text-text-muted max-w-xl leading-relaxed">
							A SecureIT nasceu da necessidade de tornar a vigilância inteligente
							acessível, fiável e multi-plataforma. A nossa missão é simples: usar
							inteligência artificial para manter as pessoas e os seus espaços seguros.
						</p>
					</RevealOnScroll>
				</div>
			</section>

			{/* Stats */}
			<section className="py-16 px-8 border-y border-border bg-surface/20">
				<div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
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

			{/* Mission */}
			<section className="py-32 px-8">
				<div className="max-w-7xl mx-auto">
					<div className="grid md:grid-cols-2 gap-16 items-center">
						<RevealOnScroll>
							<div>
								<p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">
									Missão
								</p>
								<h2 className="text-4xl font-extrabold tracking-tight mb-6">
									Vigilância inteligente
									<br />
									<span className="text-text-muted">para todos.</span>
								</h2>
								<p className="text-text-muted leading-relaxed mb-4">
									Acreditamos que segurança não deveria ser um luxo. Com tecnologia de
									inteligência artificial acessível, pretendemos que qualquer pessoa ou
									empresa possa proteger os seus espaços de forma inteligente e eficiente.
								</p>
								<p className="text-text-muted leading-relaxed">
									Desde a deteção de pessoas em tempo real até ao reconhecimento facial
									e análise comportamental — tudo funciona numa plataforma unificada que
									 funciona no desktop, navegador e telemóvel.
								</p>
							</div>
						</RevealOnScroll>

						<RevealOnScroll variant="right">
							<div className="card-sharp p-10 bg-surface/50">
								<div className="space-y-6">
									{[
										{ icon: Eye, text: "Reconhecimento facial com IA profunda" },
										{ icon: Shield, text: "Deteção de pessoas YOLOv11 em tempo real" },
										{ icon: Lock, text: "Criptografia de ponta a ponta" },
										{ icon: Globe, text: "Desktop, web e mobile sincronizados" },
										{ icon: Rocket, text: "Alertas em menos de 2 segundos" },
									].map((item) => (
										<div key={item.text} className="flex items-center gap-4">
											<div className="w-9 h-9 shrink-0 flex items-center justify-center border border-primary/25 bg-primary/10">
												<item.icon className="w-4 h-4 text-primary" />
											</div>
											<span className="text-sm text-text">{item.text}</span>
										</div>
									))}
								</div>
							</div>
						</RevealOnScroll>
					</div>
				</div>
			</section>

			{/* Values */}
			<section className="py-32 px-8 bg-surface/20">
				<div className="max-w-7xl mx-auto">
					<RevealOnScroll>
						<div className="text-center mb-20">
							<p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">
								Valores
							</p>
							<h2 className="text-4xl font-extrabold tracking-tight">
								O que nos move
							</h2>
						</div>
					</RevealOnScroll>

					<div className="grid sm:grid-cols-2 gap-px bg-border">
						{values.map((v, i) => (
							<RevealOnScroll key={v.title} delay={i * 80}>
								<div className="bg-bg p-10">
									<div className="w-11 h-11 flex items-center justify-center border border-primary/25 bg-primary/10 mb-5">
										<v.icon className="w-5 h-5 text-primary" />
									</div>
									<h3 className="text-lg font-bold text-text mb-2">{v.title}</h3>
									<p className="text-sm text-text-muted leading-relaxed">{v.description}</p>
								</div>
							</RevealOnScroll>
						))}
					</div>
				</div>
			</section>

			{/* Timeline */}
			<section className="py-32 px-8">
				<div className="max-w-3xl mx-auto">
					<RevealOnScroll>
						<div className="text-center mb-20">
							<p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">
								História
							</p>
							<h2 className="text-4xl font-extrabold tracking-tight">
								A nossa jornada
							</h2>
						</div>
					</RevealOnScroll>

					<div className="relative">
						<div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

						<div className="space-y-12">
							{milestones.map((m, i) => (
								<RevealOnScroll key={m.year + m.title} delay={i * 80}>
									<div className="flex gap-8">
										<div className="shrink-0 relative z-10">
											<div className="w-12 h-12 flex items-center justify-center bg-bg border border-primary text-primary text-xs font-bold">
												{m.year}
											</div>
										</div>
										<div className="pb-8">
											<h3 className="text-lg font-bold text-text mb-1">{m.title}</h3>
											<p className="text-sm text-text-muted leading-relaxed">{m.description}</p>
										</div>
									</div>
								</RevealOnScroll>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* Tech Stack */}
			<section className="py-24 px-8 bg-surface/20 border-y border-border">
				<div className="max-w-7xl mx-auto">
					<RevealOnScroll>
						<div className="text-center mb-16">
							<p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">
								Tecnologia
							</p>
							<h2 className="text-3xl font-extrabold tracking-tight">
								Construído com tecnologia de ponta
							</h2>
						</div>
					</RevealOnScroll>

					<div className="flex flex-wrap justify-center gap-4">
						{[
							"YOLOv11", "FaceNet", "OpenCV", "PyTorch",
							"FastAPI", "PostgreSQL", "React", "Next.js",
							"Tauri", "Expo", "Cloudflare D1", "Tailwind CSS",
						].map((tech, i) => (
							<RevealOnScroll key={tech} delay={i * 40}>
								<div className="px-5 py-2.5 border border-border bg-bg text-sm font-mono text-text-muted hover:border-primary/30 hover:text-text transition-all">
									{tech}
								</div>
							</RevealOnScroll>
						))}
					</div>
				</div>
			</section>

			<Footer />
		</div>
	);
}
