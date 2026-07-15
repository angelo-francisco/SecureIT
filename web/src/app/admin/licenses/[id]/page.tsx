import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "secureit-ui";
import { ArrowLeft, Key, User } from "lucide-react";

export default async function AdminLicenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const license = await prisma.licenseKey.findUnique({
    where: { id },
    include: {
      license: {
        include: {
          user: {
            select: { email: true, firstName: true, lastName: true },
          },
        },
      },
    },
  });

  if (!license) {
    notFound();
  }

  const statusVariant = (s: string) => {
    switch (s) {
      case "ACTIVE":
        return "success" as const;
      case "PENDING":
        return "warning" as const;
      case "REVOKED":
        return "danger" as const;
      default:
        return "outline" as const;
    }
  };

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/admin/licenses"
          className="inline-flex items-center gap-2 text-text-muted hover:text-white text-sm font-medium mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
        <h1 className="text-2xl font-display font-bold text-white">
          Detalhe da Licenca
        </h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
              <Key className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-white">Informacoes</h2>
          </div>
          <div className="space-y-4">
            <InfoRow label="Chave">
              <code className="text-primary font-mono text-sm">
                {license.key}
              </code>
            </InfoRow>
            <InfoRow label="Tipo">{license.type}</InfoRow>
            <InfoRow label="Duracao">
              {license.durationDays} dias
            </InfoRow>
            <InfoRow label="Estado">
              <Badge variant={statusVariant(license.status)}>
                {license.status}
              </Badge>
            </InfoRow>
            <InfoRow label="Lote">
              {license.batchName || "---"}
            </InfoRow>
            <InfoRow label="Criada em">
              {new Date(license.createdAt).toLocaleString("pt-BR")}
            </InfoRow>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-white">Activacao</h2>
          </div>
          {license.license ? (
            <div className="space-y-4">
              <InfoRow label="Utilizador">
                {license.license.user.firstName}{" "}
                {license.license.user.lastName}
              </InfoRow>
              <InfoRow label="Email">
                {license.license.user.email}
              </InfoRow>
              <InfoRow label="Activada em">
                {new Date(
                  license.license.activatedAt
                ).toLocaleString("pt-BR")}
              </InfoRow>
              <InfoRow label="Expira em">
                {new Date(
                  license.license.expiresAt
                ).toLocaleString("pt-BR")}
              </InfoRow>
              <InfoRow label="Ultima verificacao">
                {license.license.lastChecked
                  ? new Date(
                      license.license.lastChecked
                    ).toLocaleString("pt-BR")
                  : "Nunca"}
              </InfoRow>
              <InfoRow label="Machine Hash">
                <span className="font-mono text-xs">
                  {license.license.machineHash || "---"}
                </span>
              </InfoRow>
            </div>
          ) : (
            <p className="text-text-muted">
              Esta licenca ainda nao foi activada.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border-light last:border-0">
      <span className="text-text-muted text-sm">{label}</span>
      <span className="text-white text-sm">{children}</span>
    </div>
  );
}
