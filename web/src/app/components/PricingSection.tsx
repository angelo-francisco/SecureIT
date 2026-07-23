"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ChevronRight, Check, Zap, Shield, Eye } from "lucide-react";
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
    <section id="pricing" className="min-h-screen flex items-center justify-center px-8">
      <div className="max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-text mb-4">Planos</h3>
          <p className="text-text-muted max-w-lg mx-auto">
            Escolha o plano ideal para as suas necessidades
          </p>
        </div>

        {plans.length === 0 ? (
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[1, 2].map((i) => (
              <div key={i} className="p-8 rounded-2xl bg-surface border border-border animate-pulse h-96" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`p-8 rounded-2xl border transition-all ${
                  plan.name === "B2B"
                    ? "bg-primary/10 border-primary/25 hover:border-primary/40"
                    : "bg-surface border-border hover:border-border-light"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-xl font-semibold text-text">{plan.name}</h4>
                  {plan.name === "B2B" && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-semibold">
                      Empresas
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
                    <span className="text-sm text-text-muted">/ {plan.durationDays} dias</span>
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

                {plan.services.length > 0 && (
                  <div className="mb-6 pt-4 border-t border-border">
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Serviços</p>
                    {plan.services.map((s) => (
                      <div key={s.name} className="flex items-center justify-between text-sm text-text-muted py-1">
                        <span>{s.name}</span>
                        <span className="text-text">${s.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <Link
                  href={plan.name === "B2B" ? "/signup" : "/signup"}
                  className={`block text-center py-3 rounded-lg font-bold transition-all ${
                    plan.name === "B2B"
                      ? "bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20"
                      : "border border-border text-text-muted hover:bg-surface-hover hover:text-text"
                  }`}
                >
                  {plan.name === "B2B" ? "Escolher B2B" : "Escolher B2C"}
                </Link>
              </div>
            ))}
          </div>
        )}

        {plans.some((p) => p.features.some((f) => f.price > 0)) && (
          <div className="mt-12 max-w-4xl mx-auto">
            <h4 className="text-lg font-semibold text-text text-center mb-6">Features Adicionais</h4>
            <div className="grid md:grid-cols-3 gap-4">
              {plans[0]?.features.filter((f) => f.price > 0).map((feature) => (
                <div key={feature.name} className="p-5 rounded-xl bg-surface border border-border text-center">
                  <p className="text-sm font-semibold text-text mb-1">{feature.name}</p>
                  {feature.description && (
                    <p className="text-xs text-text-muted mb-2">{feature.description}</p>
                  )}
                  <p className="text-primary font-bold">+${feature.price.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
