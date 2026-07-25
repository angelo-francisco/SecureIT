"use client";

import { useState, forwardRef, useImperativeHandle, useCallback } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { CreditCard, Check, Upload, Loader, Landmark, X, ChevronRight, CircleCheckBig, Info, Copy, ArrowLeft, ArrowRight } from "lucide-react";
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
  reference: string | null;
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
  ({ data: initialData, onClose }, ref) => {
    const { toast } = useToast();
    const { rate, loading: rateLoading, convert } = useExchangeRate();
    const [plans, setPlans] = useState<Plan[]>(initialData.plans);
    const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(initialData.paymentInfo);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
    const [openTooltipId, setOpenTooltipId] = useState(null);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [uploadedProof, setUploadedProof] = useState<CloudinaryResult | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [step, setStep] = useState<1 | 2>(1);

    const copyToClipboard = useCallback((text: string, field: string) => {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
      });
    }, []);

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
        toast("Pagamento submetido com sucesso! Aguarde a validação em alguns instantes.");
        setSelectedPlan(null);
        setSelectedFeatures([]);
        setSelectedServices([]);
        setUploadedProof(null);
        onClose()
      } catch (err) {
        toast(err instanceof Error ? err.message : "Erro ao submeter pagamento");
      } finally {
        setSubmitting(false);
      }
    };

    const total = calculateTotal();

    return (
      <div className="space-y-6">
        {step === 1 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => !selectedPlan ? selectPlan(plan) : setSelectedPlan(null)}
                  className={`relative text-left border p-5 transition-all hover:border-primary/50 ${
                    selectedPlan?.id === plan.id
                      ? "border-primary ring-1 ring-primary/30"
                      : "border-border"
                  }`}
                >
                  <div className="absolute bottom-5 right-5">
                    {selectedPlan?.id === plan.id ? (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check size={12} className="text-white" />
                      </div>
                    ) : (
                    <div className="w-5 h-5 rounded-full bg-transparent border flex items-center justify-center">
                      </div>
                    )}
                  </div>
                    <h3 className="text-xl md:text-2xl font-bold text-text">{plan.name}</h3>
                    <p className="text-base md:text-lg text-text-muted mb-3">{plan.description}</p>
                  <div className="absolute top-5 right-5 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-text">${plan.basePrice.toFixed(2)}</span>
                    <span className="text-base md:text-lg text-gray-300">/ mês</span>
                  </div>

                  <div className="mt-3 space-y-1">
                    {INCLUDED_FEATURES.map((f) => (
                      <div key={f} className="flex items-center gap-1.5 text-lg text-text-muted">
                        <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-primary shrink-0" />
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

            <div className="flex items-center w-full gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2.5 border text-sm font-medium text-text-muted hover:text-text hover:bg-surface-hover transition-all"
              >
                <X />
              </button>
              <button
                onClick={() => selectedPlan && setStep(2)}
                disabled={!selectedPlan}
                className="w-full text-center bg-primary text-white px-6 py-2.5 text-lg font-bold hover:brightness-110 transition-all disabled:opacity-50"
              >
                Avançar
              </button>
            </div>
          </>
        )}

        {step === 2 && selectedPlan && (
          <>
            {selectedPlan.services.length > 0 && selectedPlan.services.some((s) => s.price > 0) && (
              <div>
                <h4 className="text-base md:text-xl text-text">Serviços e Funcionalidades (Opcionais)</h4>
                <div className="space-y-2 py-2">
                  {selectedPlan.services.filter((s) => s.price > 0).map((service) => {
                    const isTooltipOpen = openTooltipId === service.id;
                    return ( 
                      <label key={service.id} className="flex items-center px-4 justify-between bg-surface cursor-pointer hover:border-primary/50 transition-all">
                        <div className="flex items-center justify-start gap-2">
                          <input
                            type="checkbox"
                            checked={selectedServices.includes(service.id)}
                            onChange={() => toggleService(service.id)}
                            className="relative h-4 w-4 cursor-pointer appearance-none border border-gray-300 bg-white transition-all duration-200 
                            checked:border-primary checked:bg-primary 
                            focus:outline-none focus:ring-0 focus:ring-offset-0
                            after:absolute after:left-[50%] after:top-[50%] after:-translate-y-1/2 after:-translate-x-1/2 after:h-[10px] after:w-[5px] 
                            after:rotate-45 after:border-b-2 after:border-r-2 after:border-white after:content-[''] 
                            after:opacity-0 checked:after:opacity-100"
                          />
                          <div className="flex gap-1">
                            <span className="text-base md:text-xl font-semibold text-tex">{service.name}</span>
                            {service.description && (
                              <div className="relative flex items-center" onMouseEnter={(e) => {
                                    e.stopPropagation();
                                    setOpenTooltipId(isTooltipOpen ? null : service.id);
                                  }}
                                  onMouseLeave={(e) => {
                                    e.stopPropagation();
                                    setOpenTooltipId(null);
                                  }}>
                                <button
                                  type="button"
                                  className={`p-1 rounded-full transition-colors ${
                                    isTooltipOpen ? 'text-primary' : 'text-text-muted'
                                  }`}
                                >
                                  <Info size={20} />
                                </button>

                                {isTooltipOpen && (
                                  <div className="absolute bottom-full left-1/2 z-20 mb-2 w-64 -translate-x-1/2 rounded-lg bg-gray-900 p-3 text-xs md:text-sm text-white shadow-xl animate-fade-in">
                                    <p className="leading-tight">{service.description}</p>
                                    
                                    <div className="absolute top-full left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 bg-gray-900" />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                          <span className="text-base md:text-lg font-bold text-primary">${service.price.toFixed(2)}</span>
                      </label>
                  )})}  
                  {selectedPlan.features.filter((f) => f.price > 0).map((feature) => { 
                    const isTooltipOpen = openTooltipId === feature.id;
                    return ( 
                      <label key={feature.id} className="flex items-center px-4 justify-between bg-surface cursor-pointer hover:border-primary/50 transition-all">
                        <div className="flex items-center justify-start gap-2">
                          <input
                            type="checkbox"
                            checked={selectedFeatures.includes(feature.id)}
                            onChange={() => toggleFeature(feature.id)}
                            className="relative h-4 w-4 cursor-pointer appearance-none border border-gray-300 bg-white transition-all duration-200 
                            checked:border-primary checked:bg-primary 
                            focus:outline-none focus:ring-0 focus:ring-offset-0
                            after:absolute after:left-[50%] after:top-[50%] after:-translate-y-1/2 after:-translate-x-1/2 after:h-[10px] after:w-[5px] 
                            after:rotate-45 after:border-b-2 after:border-r-2 after:border-white after:content-[''] 
                            after:opacity-0 checked:after:opacity-100"
                          />
                          <div className="flex gap-1">
                            <span className="text-base md:text-xl font-semibold text-tex">{feature.name}</span>
                            {feature.description && (
                              <div className="relative flex items-center" onMouseEnter={(e) => {
                                    e.stopPropagation();
                                    setOpenTooltipId(isTooltipOpen ? null : feature.id);
                                  }}
                                  onMouseLeave={(e) => {
                                    e.stopPropagation();
                                    setOpenTooltipId(null);
                                  }}>
                                <button
                                  type="button"
                                  className={`p-1 rounded-full transition-colors ${
                                    isTooltipOpen ? 'text-primary' : 'text-text-muted'
                                  }`}
                                >
                                  <Info size={20} />
                                </button>

                                {isTooltipOpen && (
                                  <div className="absolute bottom-full left-1/2 z-20 mb-2 w-64 -translate-x-1/2 rounded-lg bg-gray-900 p-3 text-xs md:text-sm text-white shadow-xl animate-fade-in">
                                    <p className="leading-tight">{feature.description}</p>
                                    
                                    <div className="absolute top-full left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 bg-gray-900" />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                          <span className="text-base md:text-lg font-bold text-primary">${feature.price.toFixed(2)}</span>
                      </label>
                  )})}
                </div>
              </div>
            )}

            <div>
              <label className="text-base md:text-xl mb-2 text-text block">Dados para Pagamento</label>
              {paymentInfo ? (
                <div className="border bg-surface p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-base text-gray-200 font-bold">IBAN</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg text-text">{paymentInfo.iban}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(paymentInfo.iban, "iban")}
                        className="cursor-pointer text-text-muted hover:text-primary transition-colors"
                        title="Copiar IBAN"
                      >
                        {copiedField === "iban" ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-base text-gray-200 font-bold">Titular</span>
                    <span className="text-lg font-medium text-text">{paymentInfo.accountName}</span>
                  </div>
                  {paymentInfo.bankName && (
                    <div className="flex items-center justify-between">
                      <span className="text-base text-gray-200 font-bold">Banco</span>
                      <span className="text-lg text-text">{paymentInfo.bankName}</span>
                    </div>
                  )}
                  {paymentInfo.reference && (
                    <div className="flex items-center justify-between">
                      <span className="text-base text-gray-200 font-bold">Referência</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg text-text">{paymentInfo.reference}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(paymentInfo.reference!, "reference")}
                          className="cursor-pointer text-text-muted hover:text-primary transition-colors"
                          title="Copiar Referência"
                        >
                          {copiedField === "reference" ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-base text-gray-200 font-bold">Montante</span>
                    <span className="text-lg text-primary">{convert(total.toFixed(2))} Kz</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-text-muted text-base md:text-lg">Dados bancários não configurados</div>
              )}
            </div>

            <div>
              <label className="text-base md:text-lg text-text mb-2 block">Comprovativo de Pagamento</label>
              {uploadedProof ? (
                <div className="flex items-center gap-3 bg-success/10 border border-success/30 p-3">
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
                  className="rounded-none"
                  options={{ 
                    maxFiles: 1,
                    resourceType: "auto",
                    clientAllowedFormats: ['png', 'jpeg', 'jpg', 'webp', 'pdf'],
                    maxFileSize: 2000000,
                    multiple: false,
                    folder: "secureit/payments",
                    sources: ['local', 'url', 'camera']
                  }}
                  onError={(error, options) => {
                    toast("Erro ao carregar comprovativo");
                  }}
                  onQueuesStart={(result, { widget }) => {
                    widget.minimize();
                  }}
                  onSuccess={(result) => {
                    const info = result.info as CloudinaryResult;
                    setUploadedProof({ public_id: info.public_id, secure_url: info.secure_url });
                  }}
                >
                  {({ open, results, isLoading }) => (
                    <button onClick={() => open()} type="button" className="w-full border-2 border-dashed border-border p-6 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all">
                      <Upload size={22} className="text-text-muted" />
                      <span className="text-base text-text-muted">Clique para carregar comprovativo</span>
                      <span className="text-base text-text-muted">JPG, PNG, WebP ou PDF — máx. 2MB</span>
                    </button>
                    )
                  }
                </CldUploadWidget>
              )}
            </div>

            <div className="bg-surface border border-border p-4">
              <div className="flex items-center justify-between">
                <span className="text-base text-gray-200">Preço Base</span>
                <span className="text-lg md:text-xl text-text">${selectedPlan.basePrice.toFixed(2)}</span>
              </div>
              {selectedPlan.features.filter((f) => selectedFeatures.includes(f.id) && f.price > 0).map((f) => (
                <div key={f.id} className="flex items-center justify-between">
                  <span className="text-base text-gray-200">{f.name}</span>
                  <span className="text-lg text-text">${f.price.toFixed(2)}</span>
                </div>
              ))}
              {selectedPlan.services.filter((s) => selectedServices.includes(s.id) && s.price > 0).map((s) => (
                <div key={s.id} className="flex items-center justify-between mb-1">
                  <span className="text-base text-gray-200">{s.name}</span>
                  <span className="text-lg text-text">${s.price.toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-border mt-2 pt-2 flex items-center justify-between">
                <span className="text-lg md:text-xl font-semibold text-text">Total</span>
                <div className="text-right">
                  <span className="text-lg md:text-2xl font-bold text-primary">${total.toFixed(2)}</span>
                  <p className="text-xl md:text-xl text-gray-300">&#8776; {convert(total)} Kz</p>
                </div>
              </div>
            </div>

            

            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2.5 border text-sm font-medium text-text-muted hover:text-text hover:bg-surface-hover transition-all"
              >
                <ArrowLeft />
              </button>
              <button
              onClick={handleSubmit}
              disabled={!uploadedProof || submitting}
              className="w-full cursor-pointer bg-primary text-white text-base md:text-lg font-bold py-3 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader size={16} className="animate-spin" /> : "Submeter Pagamento"}
            </button>
            </div>
          </>
        )}
      </div>
    );
  }
);

PlansSection.displayName = "PlansSection";
