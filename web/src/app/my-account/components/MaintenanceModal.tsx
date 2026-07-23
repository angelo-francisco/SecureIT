"use client";

import { useState } from "react";
import { X, Loader, Check, Upload, Landmark, Wrench } from "lucide-react";
import { CldUploadWidget } from "next-cloudinary";
import { useToast } from "@/packages/ui";

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

interface MaintenanceModalProps {
  open: boolean;
  onClose: () => void;
  paymentInfo: PaymentInfo | null;
  hasPaidLicense: boolean;
}

export function MaintenanceModal({ open, onClose, paymentInfo, hasPaidLicense }: MaintenanceModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [description, setDescription] = useState("");
  const [uploadedProof, setUploadedProof] = useState<CloudinaryResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!description) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/maintenance/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          proofPublicId: uploadedProof?.public_id,
          proofUrl: uploadedProof?.secure_url,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as any;
        throw new Error(data.error);
      }
      toast("Pedido de manutenção submetido com sucesso!");
      reset();
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao submeter pedido");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep(1);
    setDescription("");
    setUploadedProof(null);
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Wrench size={18} className="text-primary" />
            <h2 className="text-lg font-semibold text-text">Solicitar Manutenção</h2>
          </div>
          <button onClick={handleClose} className="text-text-muted hover:text-text"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-5">
          {step === 1 && (
            <>
              <div>
                <label className="text-sm font-medium text-text mb-2 block">Descreva o problema</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o problema que está a enfrentar..."
                  rows={5}
                  className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary resize-none"
                />
              </div>
              <button
                onClick={() => description && setStep(2)}
                disabled={!description}
                className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50"
              >
                Continuar
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="bg-bg border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wrench size={16} className="text-primary" />
                  <span className="text-sm font-semibold text-text">Estado da Licença</span>
                </div>
                {hasPaidLicense ? (
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-success" />
                    <span className="text-sm text-success">Licença paga encontrada</span>
                  </div>
                ) : (
                  <p className="text-sm text-warning">Nenhuma licença paga encontrada na sua conta.</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-text mb-2 block">Comprovativo de Pagamento (opcional)</label>
                {uploadedProof ? (
                  <div className="flex items-center gap-3 bg-success/10 border border-success/30 rounded-lg p-3">
                    <Check size={18} className="text-success shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-success">Comprovativo carregado</p>
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
                      </button>
                    )}
                  </CldUploadWidget>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 border border-border text-text-muted py-2.5 rounded-lg text-sm font-bold hover:bg-surface-hover transition-all">
                  Voltar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 bg-primary text-white py-2.5 rounded-lg text-sm font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? <Loader size={14} className="animate-spin" /> : "Submeter Pedido"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
