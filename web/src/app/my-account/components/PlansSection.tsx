"use client";

import { useState, forwardRef, useImperativeHandle } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { CreditCard, Check, Upload, Loader, Landmark, ChevronRight } from "lucide-react";
import { useToast } from "@/packages/ui";
import { useExchangeRate } from "@/hooks/useExchangeRate";

export interface PlanFeature {
  id: string;
  name: string;
  description: string | null;
  price: number;
}

export interface PlanService {
  id: string;
  name: string;
  description: string | null;
  price: number;
}

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  currency: string;
  durationDays: number;
  features: PlanFeature[];
  services: PlanService[];
}

interface PaymentInfo {
  id: string;
  iban: string;
  accountName: string;
  bankName: string | null;
}

interface CloudinaryResult {
  public_id: string;
  secure_url: string;
}

interface PlansSectionProps {
  data: { plans: Plan[]; paymentInfo: PaymentInfo | null };
}

export interface PlansSectionHandle {
  fetchData: () => Promise<{ plans: Plan[]; paymentInfo: PaymentInfo | null }>;
}

const INCLUDED_FEATURES = [
  "Câmeras ilimitadas",
  "Pessoas ilimitadas",
  "Deteção de pessoas (YOLOv11)",
  "Reconhecimento facial",
  "Alertas em tempo real",
];

export const PlansSection = forwardRef<PlansSectionHandle, PlansSectionProps>(
  ({ data: initialData }, ref) => {
    const { toast } = useToast();
    const { rate, loading: rateLoading, convert } = useExchangeRate();
    const [plans, setPlans] = useState<Plan[]>(initialData.plans);
    const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(initialData.paymentInfo);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [uploadedProof, setUploadedProof] = useState<CloudinaryResult | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useImperativeHandle(ref, () => ({
      fetchData: async () => {
        const [plansRes, infoRes] = await Promise.all([
          fetch("/api/plans"),
          fetch("/api/payment-info"),
        ]);
        const p = (plansRes.ok ? await plansRes.json() : []) as any;
        const info = (infoRes.ok ? await infoRes.json() : null) as any;
        setPlans(p);
        setPaymentInfo(info);
        return { plans: p, paymentInfo: info };
      },
    }));

    const calculateTotal = (): number => {
      if (!selectedPlan) return 0;
      let total = selectedPlan.basePrice;
      for (const f of selectedPlan.features) {
        if (selectedFeatures.includes(f.id) && f.price > 0) total += f.price;
      }
      for (const s of selectedPlan.services) {
        if (selectedServices.includes(s.id) && s.price > 0) total += s.price;
      }
      return total;
    };

    const toggleFeature = (featureId: string) => {
      setSelectedFeatures((prev) =>
        prev.includes(featureId) ? prev.filter((id) => id !== featureId) : [...prev, featureId]
      );
    };

    const toggleService = (serviceId: string) => {
      setSelectedServices((prev) =>
        prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
      );
    };

    const selectPlan = (plan: Plan) => {
      setSelectedPlan(plan);
      setSelectedFeatures([]);
      setSelectedServices([]);
      setUploadedProof(null);
    };

    const handleSubmit = async () => {
      if (!selectedPlan || !uploadedProof) return;
      setSubmitting(true);
      try {
        const total = calculateTotal();
        const res = await fetch("/api/payments/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId: selectedPlan.id,
            proofPublicId: uploadedProof.public_id,
            proofUrl: uploadedProof.secure_url,
            selectedFeatures: selectedFeatures.length > 0 ? selectedFeatures : undefined,
            selectedServices: selectedServices.length > 0 ? selectedServices : undefined,
            totalPrice: total,
          }),
        });
        if (!res.ok) {
          const data = (await res.json()) as any;
          throw new Error(data.error);
        }
        toast("Pagamento submetido com sucesso! Será validado em instantes.");
        setSelectedPlan(null);
        setSelectedFeatures([]);
        setSelectedServices([]);
        setUploadedProof(null);
      } catch (err) {
        toast(err instanceof Error ? err.message : "Erro ao submeter pagamento");
      } finally {
        setSubmitting(false);
      }
    };

    const total = calculateTotal();

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => selectPlan(plan)}
              className={`text-left bg-bg border rounded-xl p-5 transition-all hover:border-primary/50 ${
                selectedPlan?.id === plan.id
                  ? "border-primary ring-1 ring-primary/30"
                  : "border-border"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-text">{plan.name}</h3>
                {selectedPlan?.id === plan.id && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                )}
              </div>
              {plan.description && (
                <p className="text-sm text-text-muted mb-3">{plan.description}</p>
              )}
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-text">${plan.basePrice.toFixed(2)}</span>
                <span className="text-xs text-text-muted">/ {plan.durationDays} dias</span>
              </div>
              <p className="text-xs text-primary mt-1">≈ {convert(plan.basePrice)} Kz</p>

              <div className="mt-3 space-y-1">
                {INCLUDED_FEATURES.map((f) => (
                  <div key={f} className="flex items-center gap-1.5 text-xs text-text-muted">
                    <ChevronRight className="w-3 h-3 text-primary shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>

        {plans.length === 0 && (
          <div className="text-center py-10 text-text-muted">
            <CreditCard size={40} className="mx-auto mb-3 opacity-50" />
            <p>Nenhum plano disponível de momento</p>
          </div>
        )}

        {selectedPlan && (
          <div className="bg-bg border border-border rounded-xl p-5 space-y-5">
            <h3 className="text-base font-semibold text-text flex items-center gap-2">
              <CreditCard size={18} className="text-primary" />
              Configurar Pedido — {selectedPlan.name}
            </h3>

            {selectedPlan.features.length > 0 && selectedPlan.features.some((f) => f.price > 0) && (
              <div>
                <h4 className="text-sm font-medium text-text mb-2">Features Opcionais</h4>
                <div className="space-y-2">
                  {selectedPlan.features.filter((f) => f.price > 0).map((feature) => (
                    <label key={feature.id} className="flex items-center justify-between p-3 bg-surface border border-border rounded-lg cursor-pointer hover:border-primary/50 transition-all">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedFeatures.includes(feature.id)}
                          onChange={() => toggleFeature(feature.id)}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <div>
                          <span className="text-sm text-text">{feature.name}</span>
                          {feature.description && (
                            <p className="text-xs text-text-muted">{feature.description}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-primary">+${feature.price.toFixed(2)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {selectedPlan.services.length > 0 && selectedPlan.services.some((s) => s.price > 0) && (
              <div>
                <h4 className="text-sm font-medium text-text mb-2">Serviços Opcionais</h4>
                <div className="space-y-2">
                  {selectedPlan.services.filter((s) => s.price > 0).map((service) => (
                    <label key={service.id} className="flex items-center justify-between p-3 bg-surface border border-border rounded-lg cursor-pointer hover:border-primary/50 transition-all">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedServices.includes(service.id)}
                          onChange={() => toggleService(service.id)}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <div>
                          <span className="text-sm text-text">{service.name}</span>
                          {service.description && (
                            <p className="text-xs text-text-muted">{service.description}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-primary">+${service.price.toFixed(2)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-text-muted">Preço Base</span>
                <span className="text-sm text-text">${selectedPlan.basePrice.toFixed(2)}</span>
              </div>
              {selectedPlan.features.filter((f) => selectedFeatures.includes(f.id) && f.price > 0).map((f) => (
                <div key={f.id} className="flex items-center justify-between mb-1">
                  <span className="text-sm text-text-muted">+ {f.name}</span>
                  <span className="text-sm text-text">${f.price.toFixed(2)}</span>
                </div>
              ))}
              {selectedPlan.services.filter((s) => selectedServices.includes(s.id) && s.price > 0).map((s) => (
                <div key={s.id} className="flex items-center justify-between mb-1">
                  <span className="text-sm text-text-muted">+ {s.name}</span>
                  <span className="text-sm text-text">${s.price.toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-border mt-2 pt-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-text">Total</span>
                <div className="text-right">
                  <span className="text-lg font-bold text-primary">${total.toFixed(2)}</span>
                  <p className="text-xs text-text-muted">≈ {convert(total)} Kz</p>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-text mb-2 block">Dados para Pagamento</label>
              {paymentInfo ? (
                <div className="bg-surface border border-border rounded-lg p-4 space-y-2.5">
                  <div className="flex items-center gap-2 mb-2">
                    <Landmark size={16} className="text-primary" />
                    <span className="text-sm font-semibold text-text">Transferência Bancária</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-muted">IBAN</span>
                    <span className="text-sm font-mono font-medium text-text">{paymentInfo.iban}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-muted">Titular</span>
                    <span className="text-sm font-medium text-text">{paymentInfo.accountName}</span>
                  </div>
                  {paymentInfo.bankName && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-muted">Banco</span>
                      <span className="text-sm font-medium text-text">{paymentInfo.bankName}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-muted">Montante</span>
                    <span className="text-sm font-bold text-primary">${total.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-text-muted text-sm">Dados bancários não configurados</div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-text mb-2 block">Comprovativo de Pagamento</label>
              {uploadedProof ? (
                <div className="flex items-center gap-3 bg-success/10 border border-success/30 rounded-lg p-3">
                  <Check size={18} className="text-success shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-success">Comprovativo carregado com sucesso</p>
                    <a href={uploadedProof.secure_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate block">Ver comprovativo</a>
                  </div>
                  <button onClick={() => setUploadedProof(null)} className="text-xs text-text-muted hover:text-error transition-colors">Remover</button>
                </div>
              ) : (
                <CldUploadWidget
                  signatureEndpoint="/api/sign-cloudinary-params"
                  uploadPreset="secureit-payments"
                  options={{ maxFiles: 1, resourceType: "image", maxFileSize: 5000000, folder: "secureit/payments" }}
                  onUpload={(error, result) => {
                    if (error) { toast("Erro ao carregar comprovativo"); return; }
                    if (result?.info) {
                      const info = result.info as CloudinaryResult;
                      setUploadedProof({ public_id: info.public_id, secure_url: info.secure_url });
                    }
                  }}
                >
                  {({ open }) => (
                    <button onClick={() => open()} type="button" className="w-full border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all">
                      <Upload size={22} className="text-text-muted" />
                      <span className="text-sm text-text-muted">Clique para carregar comprovativo</span>
                      <span className="text-xs text-text-muted">JPG, PNG ou WebP — máx. 5MB</span>
                    </button>
                  )}
                </CldUploadWidget>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!uploadedProof || submitting}
              className="w-full bg-primary text-white text-sm font-bold py-3 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader size={16} className="animate-spin" /> : "Submeter Pagamento"}
            </button>
          </div>
        )}
      </div>
    );
  }
);

PlansSection.displayName = "PlansSection";
