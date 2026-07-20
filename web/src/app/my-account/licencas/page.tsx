import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Key, Shield, Clock, Monitor } from "lucide-react";

export default async function LicencasPage() {
  const session = await getSession();
  if (!session) return null;

  let license;
  try {
    license = await prisma.license.findUnique({
      where: { userId: session.sub },
      include: { key: true },
    });
  } catch (error) {
    console.error("[Licencas]", error);
    return (
      <div className="text-center py-16 text-text-muted">
        <p>Erro ao carregar licença.</p>
      </div>
    );
  }

  const isActive = license ? license.expiresAt > new Date() : false;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-text">Licenças</h1>
        <p className="text-text-muted mt-1">Estado da sua licença</p>
      </div>

      {license ? (
        <div className="bg-surface border border-border rounded-xl p-6 space-y-6 max-w-xl">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${isActive ? "bg-success/15" : "bg-error/15"} flex items-center justify-center`}>
              <Shield size={24} className={isActive ? "text-success" : "text-error"} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text">
                Licença {isActive ? "Ativa" : "Expirada"}
              </h2>
              <p className={`text-sm font-medium ${isActive ? "text-success" : "text-error"}`}>
                {isActive ? "Ativa" : "Expirada"}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-text-muted flex items-center gap-2">
                <Key size={14} /> Chave
              </span>
              <span className="text-sm font-mono font-medium text-text">
                {license.key.key}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-text-muted">Tipo</span>
              <span className="text-sm font-medium text-text">
                {license.key.type}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-text-muted flex items-center gap-2">
                <Clock size={14} /> Duração
              </span>
              <span className="text-sm font-medium text-text">
                {license.key.durationDays} dias
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-text-muted">Ativada em</span>
              <span className="text-sm font-medium text-text">
                {new Date(license.activatedAt).toLocaleDateString("pt-PT")}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-text-muted">Expira em</span>
              <span className="text-sm font-medium text-text">
                {new Date(license.expiresAt).toLocaleDateString("pt-PT")}
              </span>
            </div>
            {license.machineHash && (
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-text-muted flex items-center gap-2">
                  <Monitor size={14} /> Máquina
                </span>
                <span className="text-xs font-mono text-text-muted truncate max-w-[200px]">
                  {license.machineHash}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-text-muted">
          <Key size={48} className="mx-auto mb-4 opacity-50" />
          <p className="mb-4">Não tem nenhuma licença ativa</p>
          <a
            href="/my-account/planos"
            className="text-primary font-bold hover:underline"
          >
            Ver planos disponíveis →
          </a>
        </div>
      )}
    </div>
  );
}
