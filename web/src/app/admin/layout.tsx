import Link from "next/link";
import { Shield, LayoutDashboard, Key, Plus } from "lucide-react";
import { cn } from "../packages/ui";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-surface border-r border-border p-6 flex flex-col">
        <Link href="/admin" className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xl font-display font-bold text-white">
            SecureIT
          </span>
        </Link>
        <nav className="space-y-1">
          <NavLink href="/admin" icon={LayoutDashboard} label="Dashboard" />
          <NavLink href="/admin/licenses" icon={Key} label="Licencas" />
          <NavLink
            href="/admin/licenses/generate"
            icon={Plus}
            label="Gerar Licencas"
          />
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 text-text-muted rounded-lg transition-all hover:text-white hover:bg-surface-hover"
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  );
}
