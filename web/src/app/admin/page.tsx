import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "../packages/ui";
import { Card } from "@/components/ui/card";
import {
  LayoutDashboard,
  Key,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [totalLicenses, activeLicenses, pendingLicenses, revokedLicenses] =
    await Promise.all([
      prisma.licenseKey.count(),
      prisma.licenseKey.count({ where: { status: "ACTIVE" } }),
      prisma.licenseKey.count({ where: { status: "PENDING" } }),
      prisma.licenseKey.count({ where: { status: "REVOKED" } }),
    ]);

  const stats = [
    {
      label: "Total de Licencas",
      value: totalLicenses,
      icon: Key,
      color: "text-white",
      iconBg: "bg-primary/15 border-primary/25",
    },
    {
      label: "Activas",
      value: activeLicenses,
      icon: CheckCircle2,
      color: "text-success",
      iconBg: "bg-success/15 border-success/25",
    },
    {
      label: "Pendentes",
      value: pendingLicenses,
      icon: Clock,
      color: "text-warning",
      iconBg: "bg-warning/15 border-warning/25",
    },
    {
      label: "Revogadas",
      value: revokedLicenses,
      icon: XCircle,
      color: "text-error",
      iconBg: "bg-error/15 border-error/25",
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-display font-bold text-white">
            Dashboard
          </h1>
        </div>
        <Link href="/admin/licenses/generate">
          <Button>
            <Plus className="w-4 h-4" />
            Gerar Licencas
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} className="group hover:border-primary/30 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-text-muted text-sm font-medium">
                  {stat.label}
                </p>
                <p className={`text-3xl font-bold mt-2 ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center ${stat.iconBg}`}
              >
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-white">Accoes Rapidas</h2>
        </div>
        <div className="flex gap-4">
          <Link href="/admin/licenses">
            <Button variant="outline">
              <Key className="w-4 h-4" />
              Ver Licencas
            </Button>
          </Link>
          <Link href="/admin/licenses/generate">
            <Button variant="outline">
              <Plus className="w-4 h-4" />
              Gerar Novas
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
