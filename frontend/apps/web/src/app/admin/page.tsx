import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminDashboard() {
  const [totalLicenses, activeLicenses, pendingLicenses, revokedLicenses] =
    await Promise.all([
      prisma.licenseKey.count(),
      prisma.licenseKey.count({ where: { status: "ACTIVE" } }),
      prisma.licenseKey.count({ where: { status: "PENDING" } }),
      prisma.licenseKey.count({ where: { status: "REVOKED" } }),
    ]);

  const stats = [
    { label: "Total de Licenças", value: totalLicenses, color: "text-white" },
    { label: "Activas", value: activeLicenses, color: "text-green-400" },
    { label: "Pendentes", value: pendingLicenses, color: "text-yellow-400" },
    { label: "Revogadas", value: revokedLicenses, color: "text-red-400" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-display font-bold text-white">Dashboard</h1>
        <Link
          href="/admin/licenses/generate"
          className="bg-[#22D3EE] text-black px-4 py-2 rounded-lg text-sm font-semibold hover:brightness-110 transition-all"
        >
          Gerar Licenças
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]"
          >
            <p className="text-gray-400 text-sm">{stat.label}</p>
            <p className={`text-3xl font-bold mt-2 ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
        <h2 className="text-lg font-semibold text-white mb-4">Acções Rápidas</h2>
        <div className="flex gap-4">
          <Link
            href="/admin/licenses"
            className="px-4 py-2 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.05] transition-all"
          >
            Ver Licenças
          </Link>
          <Link
            href="/admin/licenses/generate"
            className="px-4 py-2 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.05] transition-all"
          >
            Gerar Novas
          </Link>
        </div>
      </div>
    </div>
  );
}
