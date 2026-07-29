"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
	ChevronRight,
	Check,
	Home,
	Building2,
	Zap,
	Shield,
	Eye,
} from "lucide-react";
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
	const { rate, loading: rateLoading, convert } = useExchangeRate();
	const [plans, setPlans] = useState<Plan[]>([]);

	useEffect(() => {
		fetch("/api/plans")
			.then((r) => r.json())
			.then((data) => {
				if (Array.isArray(data)) setPlans(data);
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
					<h3 className="text-3xl font-bold text-text mb-4">Planos</h3>
					<p className="text-text-muted max-w-lg mx-auto">
						Escolha o plano ideal para as suas necessidades
					</p>
				</div>

				{plans.length === 0 ? (
					<div className="flex flex-col md:flex-row gap-6 max-w-4xl mx-auto items-stretch">
						{[1, 2].map((i) => (
							<div
								key={i}
								className="flex-1 p-8 card-sharp animate-pulse h-96"
							/>
						))}
					</div>
				) : (
					<div className="flex flex-col md:flex-row gap-6 max-w-4xl mx-auto items-stretch relative">
						{plans.map((plan, idx) => (
							<div
								key={plan.id}
								className={`flex-1 p-8 card-sharp transition-all ${
									plan.name === "B2B"
										? "bg-primary/5 border-primary/25 hover:border-primary/40"
										: "bg-surface border-border hover:border-border-light"
								}`}
							>
								<div className="flex items-center gap-2 mb-2">
									{plan.name === "B2B" ? (
										<Building2 className="w-5 h-5 text-primary shrink-0" />
									) : (
										<Home className="w-5 h-5 text-primary shrink-0" />
									)}
									<h4 className="text-xl font-semibold text-text">
										{plan.name}
									</h4>
									{plan.name === "B2B" ? (
										<span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/15">
											Empresarial
										</span>
									) : (
										<span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-text-muted bg-surface-hover">
											Residencial
										</span>
									)}
								</div>
								{plan.description && (
									<p className="text-text-muted mb-6">{plan.description}</p>
								)}

								<div className="mb-6">
									<div className="flex items-baseline gap-1">
										<span className="text-4xl font-bold text-text">
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

								<ul className="space-y-3 text-sm text-text-muted mb-8">
									{includedFeatures.map((item) => (
										<li key={item} className="flex items-center gap-2">
											<ChevronRight className="w-4 h-4 text-primary shrink-0" />
											{item}
										</li>
									))}
								</ul>

								<Link
									href="/signup"
									className={`block text-center py-3 font-bold transition-all ${
										plan.name === "B2B"
											? "bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20"
											: "border border-border text-text-muted hover:bg-surface-hover hover:text-text"
									}`}
								>
									{plan.name === "B2B" ? "Escolher B2B" : "Escolher B2C"}
								</Link>
							</div>
						))}

						<div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
							<div className="w-11 h-11 bg-surface border-2 border-border rounded-full flex items-center justify-center shadow-xl">
								<span className="text-[11px] font-bold text-text-muted tracking-wider">
									OU
								</span>
							</div>
						</div>
					</div>
				)}

				{plans.some((p) => p.features.some((f) => f.price > 0)) && (
					<div className="mt-12 max-w-4xl mx-auto">
						<h4 className="text-lg font-semibold text-text text-center mb-6">
							Features Adicionais
						</h4>
						<div className="grid md:grid-cols-3 gap-4">
							{plans[0]?.features
								.filter((f) => f.price > 0)
								.map((feature) => (
									<div
										key={feature.name}
										className="p-5 rounded-xl bg-surface border border-border text-center"
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
