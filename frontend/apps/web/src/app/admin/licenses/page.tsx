import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminLicensesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; type?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const limit = 20;
  const status = params.status || undefined;
  const type = params.type || undefined;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (type) where.type = type;

  const [licenses, total] = await Promise.all([
    prisma.licenseKey.findMany({
      where,
      include: {
        license: {
          include: {
            user: {
              select: { email: true, firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.licenseKey.count({ where }),
  ]);

  const pages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-display font-bold text-white">Licenças</h1>
        <Link
          href="/admin/licenses/generate"
          className="bg-[#22D3EE] text-black px-4 py-2 rounded-lg text-sm font-semibold hover:brightness-110 transition-all"
        >
          Gerar Licenças
        </Link>
      </div>

      <div className="flex gap-4 mb-6">
        <Link
          href="/admin/licenses"
          className={`px-4 py-2 rounded-lg text-sm ${!status ? "bg-[#22D3EE]/20 text-[#22D3EE]" : "text-gray-400 hover:text-white"}`}
        >
          Todas
        </Link>
        <Link
          href="/admin/licenses?status=PENDING"
          className={`px-4 py-2 rounded-lg text-sm ${status === "PENDING" ? "bg-yellow-400/20 text-yellow-400" : "text-gray-400 hover:text-white"}`}
        >
          Pendentes
        </Link>
        <Link
          href="/admin/licenses?status=ACTIVE"
          className={`px-4 py-2 rounded-lg text-sm ${status === "ACTIVE" ? "bg-green-400/20 text-green-400" : "text-gray-400 hover:text-white"}`}
        >
          Activas
        </Link>
        <Link
          href="/admin/licenses?status=REVOKED"
          className={`px-4 py-2 rounded-lg text-sm ${status === "REVOKED" ? "bg-red-400/20 text-red-400" : "text-gray-400 hover:text-white"}`}
        >
          Revogadas
        </Link>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">
                Chave
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">
                Tipo
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">
                Duração
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">
                Estado
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">
                Utilizador
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">
                Criada em
              </th>
            </tr>
          </thead>
          <tbody>
            {licenses.map((license) => (
              <tr
                key={license.id}
                className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-6 py-4">
                  <Link
                    href={`/admin/licenses/${license.id}`}
                    className="text-[#22D3EE] hover:underline font-mono text-sm"
                  >
                    {license.key}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">
                  {license.type}
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">
                  {license.durationDays} dias
                </td>
                <td className="px-6 py-4">
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
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">
                  {license.license?.user?.email || "—"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">
                  {new Date(license.createdAt).toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {licenses.length === 0 && (
          <div className="px-6 py-12 text-center text-gray-500">
            Nenhuma licença encontrada.
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/licenses?page=${p}${status ? `&status=${status}` : ""}`}
              className={`px-3 py-1 rounded-lg text-sm ${
                p === page
                  ? "bg-[#22D3EE]/20 text-[#22D3EE]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
