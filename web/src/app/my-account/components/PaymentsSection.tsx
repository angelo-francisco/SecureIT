"use client";

import { useState, forwardRef, useImperativeHandle } from "react";
import { Receipt } from "lucide-react";

export interface Payment {
  id: string;
  status: string;
  proofUrl: string | null;
  adminNote: string | null;
  createdAt: string;
  plan: {
    name: string;
    price: string;
  };
}

interface PaymentsSectionProps {
  data: Payment[];
}

export interface PaymentsSectionHandle {
  fetchData: () => Promise<Payment[]>;
}

export const PaymentsSection = forwardRef<PaymentsSectionHandle, PaymentsSectionProps>(
  ({ data: initialData }, ref) => {
    const [payments, setPayments] = useState<Payment[]>(initialData);

    useImperativeHandle(ref, () => ({
      fetchData: async () => {
        const res = await fetch("/api/payments");
        if (res.ok) {
          const d = await res.json();
          const arr = Array.isArray(d) ? d : [];
          setPayments(arr);
          return arr;
        }
        return [];
      },
    }));

    const statusLabel = (s: string) =>
      s === "APPROVED"
        ? "Aprovado"
        : s === "REJECTED"
        ? "Rejeitado"
        : "Pendente";

    const statusColor = (s: string) =>
      s === "APPROVED"
        ? "text-success bg-success/10"
        : s === "REJECTED"
        ? "text-error bg-error/10"
        : "text-warning bg-warning/10";

    if (payments.length === 0) {
      return (
        <div className="text-center py-8 text-text-muted">
          <Receipt size={40} className="mx-auto mb-3 opacity-50" />
          <p>Ainda não submeteu nenhum pagamento</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {payments.map((p) => (
          <div
            key={p.id}
            className="bg-bg border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3"
          >
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-text text-sm">{p.plan.name}</h4>
              <p className="text-xs text-text-muted">
                {new Date(p.createdAt).toLocaleDateString("pt-PT")} — €
                {Number(p.plan.price).toFixed(2)}
              </p>
              {p.adminNote && (
                <p className="text-xs text-text-muted mt-1 italic">
                  Nota: {p.adminNote}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {p.proofUrl && (
                <a
                  href={p.proofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  Ver comprovativo
                </a>
              )}
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor(
                  p.status
                )}`}
              >
                {statusLabel(p.status)}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }
);

PaymentsSection.displayName = "PaymentsSection";
