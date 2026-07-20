"use client";

import { useState, useEffect } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { CreditCard, Check, Upload, Loader, Landmark } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: string;
  currency: string;
  durationDays: number;
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

export default function PlanosPage() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [uploadedProof, setUploadedProof] = useState<CloudinaryResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/plans").then((r) => r.json()).then(setPlans);
    fetch("/api/admin/payment-info").then((r) => r.ok ? r.json() : null).then(setPaymentInfo).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!selectedPlan || !uploadedProof) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/payments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan.id,
          proofPublicId: uploadedProof.public_id,
          proofUrl: uploadedProof.secure_url,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast("Pagamento submetido com sucesso! Será validado em instantes.");
      setSelectedPlan(null);
      setUploadedProof(null);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao submeter pagamento");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-text">Planos</h1>
        <p className="text-text-muted mt-1">Escolha o plano ideal para si</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => { setSelectedPlan(plan); setUploadedProof(null); }}
            className={`text-left bg-surface border rounded-xl p-6 transition-all hover:border-primary/50 ${
              selectedPlan?.id === plan.id
                ? "border-primary ring-1 ring-primary/30"
                : "border-border"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-text">{plan.name}</h3>
              {selectedPlan?.id === plan.id && (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check size={14} className="text-white" />
                </div>
              )}
            </div>
            {plan.description && (
              <p className="text-sm text-text-muted mb-4">{plan.description}</p>
            )}
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-3xl font-bold text-text">€{Number(plan.price).toFixed(2)}</span>
              <span className="text-sm text-text-muted">/ {plan.durationDays} dias</span>
            </div>
          </button>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-12 text-text-muted">
          <CreditCard size={48} className="mx-auto mb-4 opacity-50" />
          <p>Nenhuma plano disponível de momento</p>
        </div>
      )}

      {selectedPlan && (
        <div className="bg-surface border border-border rounded-xl p-6 space-y-6">
          <h2 className="text-xl font-display font-semibold text-text flex items-center gap-2">
            <CreditCard size={20} className="text-primary" />
            Dados para Pagamento — {selectedPlan.name}
          </h2>

          {paymentInfo ? (
            <div className="bg-bg border border-border rounded-lg p-5 space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Landmark size={18} className="text-primary" />
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
                <span className="text-sm font-bold text-primary">€{Number(selectedPlan.price).toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-text-muted">
              <p>Dados bancários não configurados</p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-text mb-2 block">
              Comprovativo de Pagamento
            </label>
            {uploadedProof ? (
              <div className="flex items-center gap-3 bg-success/10 border border-success/30 rounded-lg p-4">
                <Check size={20} className="text-success shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-success">
                    Comprovativo carregado com sucesso
                  </p>
                  <a
                    href={uploadedProof.secure_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline truncate block"
                  >
                    Ver comprovativo
                  </a>
                </div>
                <button
                  onClick={() => setUploadedProof(null)}
                  className="text-xs text-text-muted hover:text-error transition-colors"
                >
                  Remover
                </button>
              </div>
            ) : (
              <CldUploadWidget
                signatureEndpoint="/api/sign-cloudinary-params"
                uploadPreset="secureit-payments"
                options={{
                  maxFiles: 1,
                  resourceType: "image",
                  maxFileSize: 5000000,
                  folder: "secureit/payments",
                }}
                onUpload={(error, result) => {
                  if (error) {
                    toast("Erro ao carregar comprovativo");
                    return;
                  }
                  if (result?.info) {
                    const info = result.info as CloudinaryResult;
                    setUploadedProof({
                      public_id: info.public_id,
                      secure_url: info.secure_url,
                    });
                  }
                }}
              >
                {({ open }) => (
                  <button
                    onClick={() => open()}
                    type="button"
                    className="w-full border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
                  >
                    <Upload size={24} className="text-text-muted" />
                    <span className="text-sm text-text-muted">
                      Clique para carregar comprovativo
                    </span>
                    <span className="text-xs text-text-muted">
                      JPG, PNG ou WebP — máx. 5MB
                    </span>
                  </button>
                )}
              </CldUploadWidget>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!uploadedProof || submitting}
            className="w-full bg-primary text-white text-lg font-medium py-3.5 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <Loader size={18} className="animate-spin" />
            ) : (
              "Submeter Pagamento"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
