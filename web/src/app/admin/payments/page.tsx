"use client";

import { useState, useEffect } from "react";
import { FileCheck, Check, X, Loader, ExternalLink } from "lucide-react";

interface PaymentRequest {
  id: string;
  status: string;
  proofUrl: string;
  adminNote: string | null;
  createdAt: string;
  plan: { name: string; price: string; durationDays: number };
  user: { firstName: string; lastName: string; email: string };
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchPayments = async () => {
    try {
      const res = await fetch("/api/admin/payments");
      if (!res.ok) throw new Error("Erro ao carregar pagamentos");
      const data = await res.json();
      if (Array.isArray(data)) setPayments(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, []);

  const handleAction = async (id: string, status: "APPROVED" | "REJECTED") => {
    setProcessing(id);
    const note = status === "REJECTED" ? prompt("Nota (opcional):") || "" : "";
    try {
      const res = await fetch(`/api/admin/payments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNote: note }),
      });
      if (!res.ok) throw new Error("Erro ao processar pagamento");
    } catch {
    } finally {
      setProcessing(null);
      fetchPayments();
    }
  };

  const pending = payments.filter((p) => p.status === "PENDING");
  const processed = payments.filter((p) => p.status !== "PENDING");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-white">Pedidos de Pagamento</h1>

      {loading ? (
        <p className="text-[#9dabb9]">A carregar...</p>
      ) : payments.length === 0 ? (
        <div className="text-center py-16 text-[#9dabb9]">
          <FileCheck size={48} className="mx-auto mb-4 opacity-50" />
          <p>Nenhum pedido de pagamento</p>
        </div>
      ) : (
        <div className="space-y-8">
          {pending.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-3">
                Pendentes ({pending.length})
              </h2>
              <div className="space-y-3">
                {pending.map((p) => (
                  <div
                    key={p.id}
                    className="bg-[#1c2127] border border-[#3b4754] rounded-xl p-5"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="flex-1">
                        <p className="text-white font-medium">
                          {p.user.firstName} {p.user.lastName}
                        </p>
                        <p className="text-xs text-[#9dabb9]">{p.user.email}</p>
                        <p className="text-sm text-[#9dabb9] mt-1">
                          Plano: <span className="text-white">{p.plan.name}</span> — €
                          {Number(p.plan.price).toFixed(2)} — {p.plan.durationDays} dias
                        </p>
                        <p className="text-xs text-[#9dabb9]">
                          {new Date(p.createdAt).toLocaleString("pt-PT")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={p.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 text-xs font-medium text-[#2C9ED5] border border-[#3b4754] rounded-lg hover:bg-[#283039] flex items-center gap-1"
                        >
                          <ExternalLink size={12} /> Ver Comprovativo
                        </a>
                        <button
                          onClick={() => handleAction(p.id, "APPROVED")}
                          disabled={processing === p.id}
                          className="px-3 py-2 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-1 disabled:opacity-50"
                        >
                          {processing === p.id ? <Loader size={12} className="animate-spin" /> : <Check size={12} />}
                          Aprovar
                        </button>
                        <button
                          onClick={() => handleAction(p.id, "REJECTED")}
                          disabled={processing === p.id}
                          className="px-3 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center gap-1 disabled:opacity-50"
                        >
                          <X size={12} /> Rejeitar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {processed.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-3">
                Processados ({processed.length})
              </h2>
              <div className="bg-[#1c2127] border border-[#3b4754] rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#3b4754]">
                      <th className="text-left px-6 py-3 text-xs font-medium text-[#9dabb9] uppercase">Utilizador</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-[#9dabb9] uppercase">Plano</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-[#9dabb9] uppercase">Estado</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-[#9dabb9] uppercase">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processed.map((p) => (
                      <tr key={p.id} className="border-b border-[#3b4754] last:border-0">
                        <td className="px-6 py-3">
                          <p className="text-white text-sm">{p.user.firstName} {p.user.lastName}</p>
                          <p className="text-xs text-[#9dabb9]">{p.user.email}</p>
                        </td>
                        <td className="px-6 py-3 text-sm text-white">{p.plan.name}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${p.status === "APPROVED" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                            {p.status === "APPROVED" ? "Aprovado" : "Rejeitado"}
                          </span>
                          {p.adminNote && <p className="text-xs text-[#9dabb9] mt-1 italic">{p.adminNote}</p>}
                        </td>
                        <td className="px-6 py-3 text-sm text-[#9dabb9]">
                          {new Date(p.createdAt).toLocaleDateString("pt-PT")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
