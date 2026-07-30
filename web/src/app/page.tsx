"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RevealOnScroll } from "@/components/animations/RevealOnScroll";
import { ParallaxLayer } from "@/components/animations/ParallaxLayer";
import { DownloadSection } from "@/app/components/DownloadSection";
import { useEffect, useState } from "react";

function useIsDesktop() {
	const [isDesktop, setIsDesktop] = useState(false);

	useEffect(() => {
		const getDeviceType = () => {
			const ua = navigator.userAgent;
			if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
				return "Tablet";
			}
			if (
				/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated/i.test(
					ua,
				)
			) {
				return "Mobile";
			}
			return "Desktop";
		};
		setIsDesktop(getDeviceType() === "Desktop");
	}, []);

	return isDesktop;
}
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
	Globe,
	Rocket,
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
		description:
			"Identifique automaticamente pessoas conhecidas e desconhecidas com precisão de IA.",
	},
	{
		icon: Shield,
		title: "Deteção de Pessoas",
		description:
			"YOLOv11 detecta pessoas em tempo real com alta precisão e baixa latência.",
	},
	{
		icon: Bell,
		title: "Alertas em Tempo Real",
		description:
			"Notificações instantâneas quando alguém for detectado nas suas câmeras.",
	},
	{
		icon: Brain,
		title: "Análise de Comportamento",
		description:
			"Deteção de movimentos suspeitos com análise de fluxo óptico e fundo substractivo.",
	},
	{
		icon: Laptop,
		title: "Multi-Plataforma",
		description:
			"Desktop, web e mobile. Acesse de qualquer lugar, a qualquer momento.",
	},
	{
		icon: Lock,
		title: "Criptografia Avançada",
		description:
			"Dados protegidos com criptografia de ponta a ponta e assinaturas digitais.",
	},
];

const steps = [
	{
		num: "01",
		title: "Conecte",
		description:
			"Registe as suas câmeras em minutos. Suporte para RTSP, USB e IP com configuração automática.",
		icon: Zap,
	},
	{
		num: "02",
		title: "Monitore",
		description:
			"IA analisa cada frame em tempo real. Reconhecimento facial, deteção de pessoas e análise comportamental.",
		icon: Eye,
	},
	{
		num: "03",
		title: "Reaja",
		description:
			"Receba alertas instantânos no desktop, browser ou telemóvel. Responda a incidentes em segundos.",
		icon: Bell,
	},
];

export default function HomePage() {
	const isDesktop = useIsDesktop();

	return (
		<div className="min-h-screen">
			<Navbar />

			<section
				id="home"
				className="relative min-h-screen flex items-center overflow-hidden"
			>
				<div className="absolute inset-0 bg-grid" />

				<ParallaxLayer speed="slow" className="absolute inset-0">
					<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(44,158,213,0.15)_0%,transparent_50%)]" />
					<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_80%,rgba(44,158,213,0.08)_0%,transparent_50%)]" />
				</ParallaxLayer>

				<ParallaxLayer className="absolute top-20 right-[10%] w-64 h-64 border border-primary/10 rotate-45 opacity-30" />
				<ParallaxLayer
					speed="slow"
					className="absolute bottom-32 left-[5%] w-40 h-40 border border-primary/10 rotate-12 opacity-20"
				/>

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

			<section id="about" className="py-32 px-8 border-b border-border">
				<div className="flex items-center flex-col gap-2">
					<RevealOnScroll>
						<div className="text-center">
							<p className="text-xl font-bold text-primary uppercase tracking-widest mb-4">
								Quem somos?
							</p>
							<h2 className="text-4xl font-extrabold mb-6">
								Vigilância inteligente <br className="block md:hidden" /> para
								todos
							</h2>
							<p className="text-text-muted text-lg md:text-2xl max-w-3xl mb-4">
								Com tecnologia de inteligência artificial acessível, permitimos
								a qualquer empresa ou residência garantimos a segurança do que é
								valioso para si. Desde a deteção de pessoas em tempo real até ao
								reconhecimento facial e análise comportamental. Tudo numa única
								plataforma.
							</p>
						</div>
					</RevealOnScroll>
				</div>
			</section>

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
										<h3 className="text-xl font-bold text-text">
											{feature.title}
										</h3>
									</div>
									<p className="text-lg text-text-muted leading-relaxed">
										{feature.description}
									</p>
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
												<h3 className="text-2xl font-bold text-text">
													{step.title}
												</h3>
											</div>
											<p className="text-text-muted text-lg leading-relaxed">
												{step.description}
											</p>
										</div>
									</div>
								</RevealOnScroll>
							))}
						</div>
					</div>
				</div>
			</section>

			{isDesktop && <DownloadSection />}

			<section id="contact" className="relative py-32 px-8 overflow-hidden">
				<ParallaxLayer speed="slow" className="absolute inset-0 bg-dots" />

				<div className="relative z-10 max-w-3xl mx-auto text-center">
					<RevealOnScroll variant="scale">
						<h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
							Pronto para modernizar
							<br />a sua segurança?
						</h2>
						<p className="mt-6 text-2xl text-text-muted max-w-xl mx-auto">
							Plataforma unificada para desktop, web e dispositivos móveis. Sem
							complexidade. Com inteligência artificial.
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
