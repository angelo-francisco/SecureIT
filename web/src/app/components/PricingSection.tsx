"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { useExchangeRate } from "@/hooks/useExchangeRate";

interface PlanFeature {
	name: string;
	description: string | null;
	price: number;
}

interface PlanService {
	name: string;
	description: string | null;
	price: number;
}

interface Plan {
	id: string;
	name: string;
	description: string | null;
	basePrice: number;
	currency: string;
	durationDays: number;
	features: PlanFeature[];
	services: PlanService[];
}

export function PricingSection() {
	const { convert } = useExchangeRate();
	const [plan, setPlan] = useState<Plan | null>(null);

	useEffect(() => {
		fetch("/api/plans")
			.then((r) => r.json())
			.then((data) => {
				if (Array.isArray(data) && data.length > 0) setPlan(data[0]);
			})
			.catch(() => {});
	}, []);

	const includedFeatures = [
		"Câmeras ilimitadas",
		"Pessoas ilimitadas",
		"Deteção de pessoas (YOLOv11)",
		"Reconhecimento facial",
		"Alertas em tempo real",
	];

	return (
		<section
			id="pricing"
			className="min-h-screen flex items-center justify-center px-8"
		>
			<div className="max-w-7xl mx-auto w-full">
				<div className="text-center mb-16">
					<h3 className="text-3xl font-bold text-text mb-4">
						Licenciamento
					</h3>
					<p className="text-text-muted max-w-lg mx-auto">
						Um único plano com tudo incluído
					</p>
				</div>

				{!plan ? (
					<div className="max-w-md mx-auto">
						<div className="p-8 card-sharp animate-pulse h-96" />
					</div>
				) : (
					<div className="max-w-md mx-auto">
						<div className="p-8 card-sharp bg-primary/5 border-primary/25 text-center">
							<h4 className="text-xl font-semibold text-text mb-1">
								{plan.name}
							</h4>
							<p className="text-text-muted text-sm mb-6">
								{plan.description}
							</p>

							<div className="mb-6">
								<div className="flex items-baseline justify-center gap-1">
									<span className="text-5xl font-bold text-text">
										${plan.basePrice.toFixed(2)}
									</span>
									<span className="text-sm text-text-muted">
										/ {plan.durationDays} dias
									</span>
								</div>
								<p className="text-sm text-primary mt-1">
									≈ {convert(plan.basePrice)} Kz
								</p>
							</div>

							<ul className="space-y-3 text-sm text-text-muted mb-8 text-left max-w-xs mx-auto">
								{includedFeatures.map((item) => (
									<li key={item} className="flex items-center gap-2">
										<ChevronRight className="w-4 h-4 text-primary shrink-0" />
										{item}
									</li>
								))}
							</ul>

							<Link
								href="/signup"
								className="block text-center py-3 font-bold bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
							>
								Começar Agora
							</Link>
						</div>
					</div>
				)}

				{plan?.features.some((f) => f.price > 0) && (
					<div className="mt-12 max-w-4xl mx-auto">
						<h4 className="text-lg font-semibold text-text text-center mb-6">
							Features Adicionais
						</h4>
						<div className="grid md:grid-cols-3 gap-4">
							{plan.features
								.filter((f) => f.price > 0)
								.map((feature) => (
									<div
										key={feature.name}
										className="p-5 bg-surface border border-border text-center"
									>
										<p className="text-sm font-semibold text-text mb-1">
											{feature.name}
										</p>
										{feature.description && (
											<p className="text-xs text-text-muted mb-2">
												{feature.description}
											</p>
										)}
										<p className="text-primary font-bold">
											+${feature.price.toFixed(2)}
										</p>
									</div>
								))}
						</div>
					</div>
				)}
			</div>
		</section>
	);
}
