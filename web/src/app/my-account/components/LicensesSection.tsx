"use client";

import { useState, forwardRef, useImperativeHandle } from "react";
import { Key, Shield, Clock, Eye, X } from "lucide-react";
import { Modal } from "@/packages/ui";

interface LicenseData {
  id: string;
  activatedAt: string;
  expiresAt: string;
  machineHash: string | null;
  key: {
    key: string;
    type: string;
    durationDays: number;
  };
}

interface PlanData {
  name: string;
  durationDays: number;
}

interface PaymentData {
  id: string;
  planId: string;
  status: string;
  adminNote: string | null;
  selectedFeatures: string | null;
  selectedServices: string | null;
  totalPrice: number | null;
  createdAt: string;
  reviewedAt: string | null;
  plan: PlanData;
}

interface LicensesApiResponse {
  license: LicenseData | null;
  payments: PaymentData[];
}

interface LicensesSectionProps {
  data: LicensesApiResponse | null;
  onNavigateToPlans?: () => void;
}

export interface LicensesSectionHandle {
  fetchData: () => Promise<LicensesApiResponse | null>;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pendente", color: "text-warning" },
  APPROVED: { label: "Aprovado", color: "text-success" },
  REJECTED: { label: "Rejeitado", color: "text-error" },
};

export const LicensesSection = forwardRef<LicensesSectionHandle, LicensesSectionProps>(
  ({ data }, ref) => {
    const [response, setResponse] = useState<LicensesApiResponse | null>(data);
    const [detailPayment, setDetailPayment] = useState<PaymentData | null>(null);

    useImperativeHandle(ref, () => ({
      fetchData: async () => {
        const res = await fetch("/api/my-account/license");
        if (res.ok) {
          const d = (await res.json()) as LicensesApiResponse;
          setResponse(d);
          return d;
        }
        return null;
      },
    }));

    const payments = response?.payments ?? [];
    const license = response?.license;
    const isActive = license
      ? license.status === "ACTIVE" && new Date(license.expiresAt) > new Date()
      : false;

    return (
      <div className="space-y-4">
        {license && (
          <div className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                isActive ? "bg-success/15" : "bg-error/15"
              }`}
            >
              <Shield size={18} className={isActive ? "text-success" : "text-error"} />
            </div>
            <div>
              <p className="text-base font-medium text-text">
                Licença {isActive ? "Ativa" : "Expirada"} — {license.key.type}
              </p>
              <p className={`text-sm font-medium ${isActive ? "text-success" : "text-error"}`}>
                Expira em {new Date(license.expiresAt).toLocaleDateString("pt-PT")}
              </p>
            </div>
          </div>
        )}

        {payments.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <Key size={40} className="text-primary mx-auto mb-3" />
            <p className="text-base md:text-lg">Nenhum registo de licença encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-base md:text-lg">
              <thead>
                <tr className="border-b border-border text-left text-sm font-medium text-text-muted uppercase tracking-wider">
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Plano</th>
                  <th className="px-4 py-3">Duração</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Preço</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {payments.map((p) => {
                  const s = STATUS_LABELS[p.status] ?? { label: p.status, color: "text-text-muted" };
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-surface-hover/50 transition-colors cursor-pointer"
                      onClick={() => setDetailPayment(p)}
                    >
                      <td className="px-4 py-3.5 text-text whitespace-nowrap">
                        {new Date(p.createdAt).toLocaleDateString("pt-PT")}
                      </td>
                      <td className="px-4 py-3.5 text-text font-medium">{p.plan.name}</td>
                      <td className="px-4 py-3.5 text-text-muted">{p.plan.durationDays} dias</td>
                      <td className={`px-4 py-3.5 font-medium ${s.color}`}>{s.label}</td>
                      <td className="px-4 py-3.5 text-right text-text font-medium">
                        {p.totalPrice != null ? `$${p.totalPrice.toFixed(2)}` : "—"}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button className="p-1 rounded hover:bg-surface-hover text-text-muted hover:text-text transition-colors">
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {detailPayment && (
          <Modal open onClose={() => setDetailPayment(null)} className="w-full max-w-lg mx-4">
            <div className="bg-surface border border-border p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl md:text-2xl font-display font-bold text-text">Detalhes da Licença</h3>
                <button
                  onClick={() => setDetailPayment(null)}
                  className="p-1.5 border text-text-muted hover:text-text hover:bg-surface-hover transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <DetailRow label="Plano" value={detailPayment.plan.name} />
                <DetailRow label="Estado" value={
                  <span className={`font-medium ${STATUS_LABELS[detailPayment.status]?.color ?? ""}`}>
                    {STATUS_LABELS[detailPayment.status]?.label ?? detailPayment.status}
                  </span>
                } />
                <DetailRow label="Duração" value={`${detailPayment.plan.durationDays} dias`} />
                <DetailRow label="Preço" value={detailPayment.totalPrice != null ? `$${detailPayment.totalPrice.toFixed(2)}` : "—"} />
                <DetailRow
                  label="Submetido em"
                  value={new Date(detailPayment.createdAt).toLocaleString("pt-PT")}
                />
                {detailPayment.reviewedAt && (
                  <DetailRow
                    label="Revisado em"
                    value={new Date(detailPayment.reviewedAt).toLocaleString("pt-PT")}
                  />
                )}
                {detailPayment.adminNote && (
                  <DetailRow label="Nota do admin" value={detailPayment.adminNote} />
                )}
                {detailPayment.selectedFeatures && (
                  <DetailRow label="Features" value={detailPayment.selectedFeatures} />
                )}
                {detailPayment.selectedServices && (
                  <DetailRow label="Serviços" value={detailPayment.selectedServices} />
                )}
                {license && detailPayment.status === "APPROVED" && (
                  <>
                    <div className="border-t border-border my-3" />
                    <DetailRow label="Chave" value={
                      <code className="font-mono text-sm">{license.key.key}</code>
                    } />
                    <DetailRow
                      label="Ativada em"
                      value={new Date(license.activatedAt).toLocaleString("pt-PT")}
                    />
                    <DetailRow
                      label="Expira em"
                      value={new Date(license.expiresAt).toLocaleString("pt-PT")}
                    />
                    {license.machineHash && (
                      <DetailRow label="Máquina" value={
                        <code className="font-mono text-sm break-all">{license.machineHash}</code>
                      } />
                    )}
                  </>
                )}
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }
);

LicensesSection.displayName = "LicensesSection";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-base text-text-muted shrink-0">{label}</span>
      <span className="text-base text-text text-right">{value}</span>
    </div>
  );
}
