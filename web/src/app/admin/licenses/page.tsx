import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Key, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function AdminLicensesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; type?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const limit = 20;
  const status = params.status || undefined;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

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

  const filters = [
    { label: "Todas", value: null },
    { label: "Pendentes", value: "PENDING" },
    { label: "Activas", value: "ACTIVE" },
    { label: "Revogadas", value: "REVOKED" },
  ];

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
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Key className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-display font-bold text-white">
            Licencas
          </h1>
        </div>
        <Link href="/admin/licenses/generate">
          <Button>
            <Plus className="w-4 h-4" />
            Gerar Licencas
          </Button>
        </Link>
      </div>

      <div className="flex gap-2 mb-6">
        {filters.map((f) => (
          <Link
            key={f.label}
            href={
              f.value ? `/admin/licenses?status=${f.value}` : "/admin/licenses"
            }
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              status === f.value || (!status && !f.value)
                ? "bg-primary/15 text-primary border border-primary/25"
                : "text-text-muted hover:text-white hover:bg-surface-hover"
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Chave</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Duracao</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Utilizador</TableHead>
            <TableHead>Criada em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {licenses.map((license) => (
            <TableRow key={license.id}>
              <TableCell>
                <Link
                  href={`/admin/licenses/${license.id}`}
                  className="text-primary hover:underline font-mono text-sm"
                >
                  {license.key}
                </Link>
              </TableCell>
              <TableCell className="text-text-muted">{license.type}</TableCell>
              <TableCell className="text-text-muted">
                {license.durationDays} dias
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant(license.status)}>
                  {license.status}
                </Badge>
              </TableCell>
              <TableCell className="text-text-muted">
                {license.license?.user?.email || "---"}
              </TableCell>
              <TableCell className="text-text-muted">
                {new Date(license.createdAt).toLocaleDateString("pt-BR")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {licenses.length === 0 && (
        <div className="px-6 py-16 text-center text-text-muted">
          Nenhuma licenca encontrada.
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/licenses?page=${p}${status ? `&status=${status}` : ""}`}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                p === page
                  ? "bg-primary/15 text-primary border border-primary/25"
                  : "text-text-muted hover:text-white hover:bg-surface-hover"
              )}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
