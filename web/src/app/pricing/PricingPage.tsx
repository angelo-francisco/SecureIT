"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RevealOnScroll } from "@/components/animations/RevealOnScroll";
import { ParallaxLayer } from "@/components/animations/ParallaxLayer";
import { PricingSection } from "@/app/components/PricingSection";
import { ChevronDown, Check, MessageCircle, Mail, Phone } from "lucide-react";

const faqs = [
	{
		q: "Posso experimentar antes de comprar?",
		a: "Sim! Oferecemos um período de teste gratuito de 14 dias para todos os planos, sem necessidade de cartão de crédito.",
	},
	{
		q: "Quantas câmeras posso ligar?",
		a: "Todos os planos incluem câmeras ilimitadas. Não há restrições no número de câmeras ou dispositivos.",
	},
	{
		q: "Funciona com qualquer câmera?",
		a: "Sim! Suportamos câmeras RTSP, USB e IP. A maioria das marcas populares é compatível, incluindo Hikvision, Dahua, TP-Link e mais.",
	},
	{
		q: "Preciso de internet sempre ligada?",
		a: "A aplicação desktop funciona parcialmente offline para processamento de IA. A sincronização e alertas remotos requerem ligação à internet.",
	},
	{
		q: "Os meus dados estão seguros?",
		a: "Absolutamente. Utilizamos criptografia de ponta a ponta, assinaturas digitais e nunca partilhamos dados com terceiros.",
	},
	{
		q: "Posso cancelar a qualquer momento?",
		a: "Sim, sem penalizações. Pode cancelar a sua subscrição a qualquer momento e continua a ter acesso até ao fim do período pago.",
	},
	{
		q: "Que suporte técnico oferecem?",
		a: "Suporte por WhatsApp, email e telefone durante horário comercial. Clientes B2B têm suporte prioritário 24/7.",
	},
	{
		q: "Como funciona o reconhecimento facial?",
		a: "A IA detecta e identifica rostos em tempo real, comparando com a base de dados de pessoas registadas. Funciona mesmo com pouca luz.",
	},
];

function FAQItem({ q, a }: { q: string; a: string }) {
	const [open, setOpen] = useState(false);
	return (
		<div className="border border-border bg-bg">
			<button
				onClick={() => setOpen(!open)}
				className="w-full flex items-center justify-between p-6 text-left"
			>
				<span className="text-sm font-semibold text-text pr-4">{q}</span>
				<ChevronDown
					className={`w-4 h-4 text-text-muted shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
				/>
			</button>
			<div className="accordion-grid" data-open={open}>
				<div>
					<p className="px-6 pb-6 text-sm text-text-muted leading-relaxed">{a}</p>
				</div>
			</div>
		</div>
	);
}

export function PricingPageContent() {
	return (
		<div className="min-h-screen">
			<Navbar />

			<section className="relative min-h-[50vh] flex items-center overflow-hidden pt-24">
				<div className="absolute inset-0 bg-dots" />
				<ParallaxLayer speed="slow" className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(44,158,213,0.1)_0%,transparent_60%)]" />

				<div className="relative z-10 max-w-7xl mx-auto px-8 py-20 w-full text-center">
					<RevealOnScroll variant="scale">
						<h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-[0.95]">
							Planos simples.
							<br />
							<span className="gradient-text">Sem surpresas.</span>
						</h1>
						<p className="mt-6 text-lg text-text-muted max-w-lg mx-auto">
							Escolha o plano ideal para as suas necessidades.
							Câmeras ilimitadas em todos os planos.
						</p>
					</RevealOnScroll>
				</div>
			</section>

			{/* Pricing Cards */}
			<section className="pb-32 px-8">
				<RevealOnScroll>
					<PricingSection />
				</RevealOnScroll>
			</section>

			<div className="section-line max-w-7xl mx-auto" />

			{/* Feature Comparison */}
			<section className="py-32 px-8">
				<div className="max-w-5xl mx-auto">
					<RevealOnScroll>
						<div className="text-center mb-16">
							<p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">
								Incluído em todos os planos
							</p>
							<h2 className="text-3xl font-extrabold tracking-tight">
								O que obtém
							</h2>
						</div>
					</RevealOnScroll>

					<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
						{[
							"Câmeras ilimitadas",
							"Pessoas ilimitadas",
							"Deteção de pessoas (YOLOv11)",
							"Reconhecimento facial",
							"Alertas em tempo real",
							"Multi-plataforma",
							"Criptografia E2E",
							"Actualizações gratuitas",
							"Suporte por WhatsApp",
						].map((feature, i) => (
							<RevealOnScroll key={feature} delay={i * 40}>
								<div className="bg-bg p-6 flex items-center gap-3">
									<div className="w-6 h-6 shrink-0 flex items-center justify-center bg-success/15 border border-success/25">
										<Check className="w-3.5 h-3.5 text-success" />
									</div>
									<span className="text-sm text-text">{feature}</span>
								</div>
							</RevealOnScroll>
						))}
					</div>
				</div>
			</section>

			<div className="section-line max-w-7xl mx-auto" />

			{/* FAQ */}
			<section className="py-32 px-8 bg-surface/20">
				<div className="max-w-3xl mx-auto">
					<RevealOnScroll>
						<div className="text-center mb-16">
							<p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">
								Perguntas Frequentes
							</p>
							<h2 className="text-4xl font-extrabold tracking-tight">
								Ainda tem dúvidas?
							</h2>
						</div>
					</RevealOnScroll>

					<div className="space-y-px">
						{faqs.map((faq) => (
							<FAQItem key={faq.q} q={faq.q} a={faq.a} />
						))}
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="py-32 px-8">
				<div className="max-w-3xl mx-auto text-center">
					<RevealOnScroll variant="scale">
						<h2 className="text-4xl font-extrabold tracking-tight mb-6">
							Precisa de um plano personalizado?
						</h2>
						<p className="text-text-muted mb-10 max-w-lg mx-auto">
							Para empresas com necessidades específicas, oferecemos planos
							customizados. Fale connosco.
						</p>
						<div className="flex flex-wrap items-center justify-center gap-4">
							<a
								href="https://wa.me/244926422462"
								target="_blank"
								rel="noopener noreferrer"
								className="group inline-flex items-center gap-2 px-8 py-4 bg-primary text-white font-semibold text-sm hover:bg-primary-hover transition-all"
							>
								<MessageCircle className="w-4 h-4" />
								Falar no WhatsApp
							</a>
							<a
								href="mailto:newstatesofficial@gmail.com"
								className="inline-flex items-center gap-2 px-8 py-4 border border-border text-text-muted font-medium text-sm hover:border-border-light hover:text-text transition-all"
							>
								<Mail className="w-4 h-4" />
								Enviar Email
							</a>
						</div>
					</RevealOnScroll>
				</div>
			</section>

			<Footer />
		</div>
	);
}
