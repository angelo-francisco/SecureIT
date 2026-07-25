"use client";

import { useState, useEffect } from "react";
import { Modal, useToast } from "@/packages/ui";
import {
  X,
  Check,
  Upload,
  Loader,
  Landmark,
  CreditCard,
  ChevronRight,
  ArrowLeft,
  Copy,
} from "lucide-react";
import { CldUploadWidget } from "next-cloudinary";
import type { Plan } from "./PlansSection";

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

interface NewLicenseModalProps {
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function NewLicenseModal({
  open,
  onClose,
  onComplete,
}: NewLicenseModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [uploadedProof, setUploadedProof] =
    useState<CloudinaryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  useEffect(() => {
    if (open) {
      setStep(1);
      setSelectedPlan(null);
      setUploadedProof(null);
      setLoading(true);
      Promise.all([
        fetch("/api/plans").then((r) => (r.ok ? r.json() : []) as any),
        fetch("/api/payment-info").then((r) => (r.ok ? r.json() : null) as any),
      ])
        .then(([p, info]) => {
          setPlans(Array.isArray(p) ? p : []);
          setPaymentInfo(info);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open]);

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setStep(2);
  };

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
        const data = (await res.json()) as any;
        throw new Error(data.error);
      }
      toast("Pagamento submetido com sucesso! Será validado em instantes.");
      onComplete?.();
      onClose();
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Erro ao submeter pagamento"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="bg-surface backdrop-blur-sm p-8 w-full max-w-md space-y-4 border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            
            <div>
              <h3 className="text-lg md:text-xl font-semibold text-text">
                {step === 1 ? "Escolher Plano" : "Dados para Pagamento"}
              </h3>
              <p className="text-base md:text-lg text-text-muted">
                {step === 1
                  ? "Selecione o plano desejado"
                  : selectedPlan?.name}
              </p>
            </div>
          </div>
          <div className="flex gap-2 items-center justify-center">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-all"
              >
                <ArrowLeft size={18} />
              </button>
            )}
           <button
                onClick={onClose}
                className="px-4 py-2.5 border text-sm font-medium text-text-muted hover:text-text hover:bg-surface-hover transition-all"
              >
                <X />
              </button>
            </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {loading ? (
            <div className="py-12 flex flex-col items-center gap-3">
              <Loader size={24} className="text-primary animate-spin" />
              <p className="text-sm text-text-muted">A carregar planos...</p>
            </div>
          ) : step === 1 ? (
            /* Step 1 — Plan selection */
            <div className="space-y-3">
              {plans.length === 0 ? (
                <div className="text-center py-10 text-text-muted">
                  <CreditCard
                    size={40}
                    className="mx-auto mb-3 opacity-50"
                  />
                  <p className="text-base md:text-lg">Nenhum plano disponível de momento</p>
                </div>
              ) : (
                plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => handleSelectPlan(plan)}
                    className="w-full text-left bg-bg border border-border rounded-xl p-4 transition-all hover:border-primary/50 hover:bg-primary/5 group flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-text">
                        {plan.name}
                      </h4>
                      {plan.description && (
                        <p className="text-xs text-text-muted mt-0.5">
                          {plan.description}
                        </p>
                      )}
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-xl font-bold text-text">
                          €{Number(plan.basePrice).toFixed(2)}
                        </span>
                        <span className="text-xs text-text-muted">
                          / {plan.durationDays} dias
                        </span>
                      </div>
                    </div>
                    <ChevronRight
                      size={18}
                      className="text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-3"
                    />
                  </button>
                ))
              )}
            </div>
          ) : (
            /* Step 2 — Payment details */
            <div className="space-y-5">
              {/* Bank details */}
              {paymentInfo ? (
                <div className="bg-bg border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Landmark size={16} className="text-primary" />
                    <span className="text-sm font-semibold text-text">
                      Transferência Bancária
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-muted">IBAN</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-medium text-text">
                          {paymentInfo.iban}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(paymentInfo.iban, "iban")}
                          className="cursor-pointer text-text-muted hover:text-primary transition-colors"
                          title="Copiar IBAN"
                        >
                          {copiedField === "iban" ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-muted">Titular</span>
                      <span className="text-sm font-medium text-text">
                        {paymentInfo.accountName}
                      </span>
                    </div>
                    {paymentInfo.bankName && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-text-muted">Banco</span>
                        <span className="text-sm font-medium text-text">
                          {paymentInfo.bankName}
                        </span>
                      </div>
                    )}
                    {paymentInfo.reference && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-text-muted">Referência</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-medium text-text">
                            {paymentInfo.reference}
                          </span>
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
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-sm text-text-muted">Montante</span>
                      <span className="text-base font-bold text-primary">
                        €{Number(selectedPlan?.basePrice || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-text-muted text-sm">
                  Dados bancários não configurados
                </div>
              )}

              {/* Upload */}
              <div>
                <label className="text-sm font-medium text-text mb-2 block">
                  Comprovativo de Pagamento
                </label>
                {uploadedProof ? (
                  <div className="flex items-center gap-3 bg-success/10 border border-success/30 rounded-xl p-3">
                    <Check size={18} className="text-success shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-success">
                        Comprovativo carregado
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
                        const info =
                          result.info as CloudinaryResult;
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
                        className="w-full border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
                      >
                        <Upload
                          size={22}
                          className="text-text-muted"
                        />
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

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!uploadedProof || submitting}
                className="w-full bg-primary text-white text-sm font-bold py-3.5 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  "Submeter Pagamento"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
