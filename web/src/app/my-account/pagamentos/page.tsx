import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Receipt } from "lucide-react";

export default async function PagamentosPage() {
  const session = await getSession();
  if (!session) return null;

  let payments;
  try {
    payments = await prisma.paymentRequest.findMany({
      where: { userId: session.sub },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("[Pagamentos]", error);
    return (
      <div className="text-center py-16 text-text-muted">
        <p>Erro ao carregar pagamentos.</p>
      </div>
    );
  }

  const statusLabel = (s: string) =>
    s === "APPROVED" ? "Aprovado" : s === "REJECTED" ? "Rejeitado" : "Pendente";
  const statusColor = (s: string) =>
    s === "APPROVED"
      ? "text-success bg-success/10"
      : s === "REJECTED"
      ? "text-error bg-error/10"
      : "text-warning bg-warning/10";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-text">Pagamentos</h1>
        <p className="text-text-muted mt-1">Histórico de submissões de pagamento</p>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <Receipt size={48} className="mx-auto mb-4 opacity-50" />
          <p>Ainda não submeteu nenhum pagamento</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => (
            <div
              key={p.id}
              className="bg-surface border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-text">{p.plan.name}</h3>
                <p className="text-sm text-text-muted">
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
                  className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(
                    p.status
                  )}`}
                >
                  {statusLabel(p.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
