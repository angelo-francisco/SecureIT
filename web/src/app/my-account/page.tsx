import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import {
  CreditCard,
  Receipt,
  Users,
  Key,
  Shield,
  Plus,
} from "lucide-react";

const COLORS = [
  "#2C9ED5", "#E04F5D", "#6C5CE7", "#00B894",
  "#FDCB6E", "#E17055", "#0984E3", "#A29BFE",
];

export default async function MyAccountPage() {
  const session = await getSession();
  if (!session) return null;

  let user, license, profiles, recentPayments, plans;
  try {
    [user, license, profiles, recentPayments, plans] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.sub },
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          createdAt: true,
        },
      }),
      prisma.license.findUnique({
        where: { userId: session.sub },
        include: { key: true },
      }),
      prisma.subProfile.findMany({
        where: { userId: session.sub },
        orderBy: { createdAt: "asc" },
      }),
      prisma.paymentRequest.findMany({
        where: { userId: session.sub },
        include: { plan: true },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prisma.plan.count({ where: { isActive: true } }),
    ]);
  } catch (error) {
    console.error("[MyAccount]", error);
    return (
      <div className="text-center py-16 text-text-muted">
        <p>Erro ao carregar dados. Tente novamente.</p>
      </div>
    );
  }

  if (!user) return null;

  const initials = (user.firstName?.[0] || "U") + (user.lastName?.[0] || "U");
  const isLicenseActive = license ? license.expiresAt > new Date() : false;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-display font-bold text-text">
          Olá, {user.firstName} 👋
        </h1>
        <p className="text-text-muted mt-1">
          Gira a sua conta, sub-perfis e assinaturas
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-semibold text-text">
            Os seus perfis
          </h2>
          <Link
            href="/my-account/perfis"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            Ver todos
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          <Link
            href="/my-account/perfis"
            className="shrink-0 w-28 flex flex-col items-center gap-2 group"
          >
            <div className="w-20 h-20 rounded-full bg-surface-hover border-2 border-dashed border-border flex items-center justify-center group-hover:border-primary transition-colors">
              <Plus size={24} className="text-text-muted group-hover:text-primary transition-colors" />
            </div>
            <span className="text-xs text-text-muted">Novo perfil</span>
          </Link>
          {profiles.map((p, i) => (
            <Link
              key={p.id}
              href="/my-account/perfis"
              className="shrink-0 w-28 flex flex-col items-center gap-2 group"
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold group-hover:scale-105 transition-transform"
                style={{ backgroundColor: p.avatarColor || COLORS[i % COLORS.length] }}
              >
                {(p.name?.[0] || "?").toUpperCase()}
              </div>
              <span className="text-xs text-text-muted truncate w-full text-center">
                {p.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href="/my-account/licencas"
          className="bg-surface border border-border rounded-xl p-6 hover:border-primary/50 transition-all group"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
              <Shield size={20} className="text-primary" />
            </div>
            <h3 className="font-semibold text-text">Licença</h3>
          </div>
          {license ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Estado</span>
                <span className={`text-sm font-medium ${isLicenseActive ? "text-success" : "text-error"}`}>
                  {isLicenseActive ? "Ativa" : "Expirada"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Tipo</span>
                <span className="text-sm font-medium text-text">
                  {license.key.type}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Expira</span>
                <span className="text-sm font-medium text-text">
                  {new Date(license.expiresAt).toLocaleDateString("pt-PT")}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-text-muted">Sem licença ativa</p>
              <p className="text-sm text-primary group-hover:underline">
                Ver planos disponíveis →
              </p>
            </div>
          )}
        </Link>

        <Link
          href="/my-account/planos"
          className="bg-surface border border-border rounded-xl p-6 hover:border-primary/50 transition-all group"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
              <CreditCard size={20} className="text-primary" />
            </div>
            <h3 className="font-semibold text-text">Planos</h3>
          </div>
          <p className="text-sm text-text-muted mb-2">
            {plans > 0 ? `${plans} planos disponíveis` : "Nenhum plano disponível"}
          </p>
          <p className="text-sm text-primary group-hover:underline">
            Ver planos →
          </p>
        </Link>

        <Link
          href="/my-account/pagamentos"
          className="bg-surface border border-border rounded-xl p-6 hover:border-primary/50 transition-all group"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
              <Receipt size={20} className="text-primary" />
            </div>
            <h3 className="font-semibold text-text">Pagamentos</h3>
          </div>
          {recentPayments.length > 0 ? (
            <div className="space-y-2">
              {recentPayments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-text-muted truncate">{p.plan.name}</span>
                  <span
                    className={`font-medium ${
                      p.status === "APPROVED"
                        ? "text-success"
                        : p.status === "REJECTED"
                        ? "text-error"
                        : "text-warning"
                    }`}
                  >
                    {p.status === "APPROVED"
                      ? "Aprovado"
                      : p.status === "REJECTED"
                      ? "Rejeitado"
                      : "Pendente"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">Sem pagamentos</p>
          )}
        </Link>

        <Link
          href="/my-account/perfis"
          className="bg-surface border border-border rounded-xl p-6 hover:border-primary/50 transition-all group"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
              <Users size={20} className="text-primary" />
            </div>
            <h3 className="font-semibold text-text">Sub-perfis</h3>
          </div>
          <p className="text-sm text-text-muted mb-2">
            {profiles.length} perfis criados
          </p>
          <p className="text-sm text-primary group-hover:underline">
            Gerir perfis →
          </p>
        </Link>
      </div>
    </div>
  );
}
