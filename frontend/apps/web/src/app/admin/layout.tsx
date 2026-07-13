import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-white/[0.02] border-r border-white/[0.06] p-6">
        <Link href="/admin" className="text-xl font-display font-bold text-white">
          SecureIT Admin
        </Link>
        <nav className="mt-8 space-y-2">
          <Link
            href="/admin"
            className="block px-4 py-2 text-gray-400 hover:text-white hover:bg-white/[0.05] rounded-lg transition-all"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/licenses"
            className="block px-4 py-2 text-gray-400 hover:text-white hover:bg-white/[0.05] rounded-lg transition-all"
          >
            Licenças
          </Link>
          <Link
            href="/admin/licenses/generate"
            className="block px-4 py-2 text-gray-400 hover:text-white hover:bg-white/[0.05] rounded-lg transition-all"
          >
            Gerar Licenças
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
