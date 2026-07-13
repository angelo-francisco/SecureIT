import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href="/admin/licenses"
            className="text-gray-400 hover:text-white text-sm mb-2 block"
          >
            ← Voltar
          </Link>
          <h1 className="text-2xl font-display font-bold text-white">
            Detalhe da Licença
          </h1>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8">
          <h2 className="text-lg font-semibold text-white mb-6">Informações</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Chave</span>
              <code className="text-[#22D3EE] font-mono">{license.key}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Tipo</span>
              <span className="text-white">{license.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Duração</span>
              <span className="text-white">{license.durationDays} dias</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Estado</span>
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  license.status === "ACTIVE"
                    ? "bg-green-400/20 text-green-400"
                    : license.status === "PENDING"
                      ? "bg-yellow-400/20 text-yellow-400"
                      : "bg-red-400/20 text-red-400"
                }`}
              >
                {license.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Lote</span>
              <span className="text-white">{license.batchName || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Criada em</span>
              <span className="text-white">
                {new Date(license.createdAt).toLocaleString("pt-BR")}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8">
          <h2 className="text-lg font-semibold text-white mb-6">Activação</h2>
          {license.license ? (
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Utilizador</span>
                <span className="text-white">
                  {license.license.user.firstName}{" "}
                  {license.license.user.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Email</span>
                <span className="text-white">
                  {license.license.user.email}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Activada em</span>
                <span className="text-white">
                  {new Date(license.license.activatedAt).toLocaleString("pt-BR")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Expira em</span>
                <span className="text-white">
                  {new Date(license.license.expiresAt).toLocaleString("pt-BR")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Última verificação</span>
                <span className="text-white">
                  {license.license.lastChecked
                    ? new Date(license.license.lastChecked).toLocaleString(
                        "pt-BR"
                      )
                    : "Nunca"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Machine Hash</span>
                <span className="text-white font-mono text-xs">
                  {license.license.machineHash || "—"}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Esta licença ainda não foi activada.</p>
          )}
        </div>
      </div>
    </div>
  );
}
