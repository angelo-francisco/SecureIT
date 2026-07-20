"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Receipt,
  Users,
  Key,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/my-account", label: "Dashboard", icon: LayoutDashboard },
  { href: "/my-account/planos", label: "Planos", icon: CreditCard },
  { href: "/my-account/pagamentos", label: "Pagamentos", icon: Receipt },
  { href: "/my-account/perfis", label: "Sub-perfis", icon: Users },
  { href: "/my-account/licencas", label: "Licenças", icon: Key },
  { href: "/my-account/definicoes", label: "Definições", icon: Settings },
];

interface AccountNavbarProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export function AccountNavbar({ user }: AccountNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between px-4 md:px-8 h-16 max-w-7xl mx-auto">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="SecureIT"
              width={28}
              height={28}
              loading="eager"
              fetchPriority="high"
            />
            <span className="text-lg font-display font-bold text-text hidden sm:block">
              SecureIT
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/my-account"
                  ? pathname === "/my-account"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-text-muted hover:text-text hover:bg-surface-hover"
                  )}
                >
                  <link.icon size={16} />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          <div className="relative hidden md:block">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-surface-hover transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-sm font-bold text-primary">
                {initials}
              </div>
              <span className="text-sm font-medium text-text">
                {user.firstName}
              </span>
            </button>

            {profileOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setProfileOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-border">
                    <p className="text-sm font-medium text-text">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-text-muted truncate">
                      {user.email}
                    </p>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-error hover:bg-error/10 transition-all"
                    >
                      <LogOut size={16} />
                      Terminar Sessão
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-text-muted hover:text-text transition-colors"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-border bg-surface animate-slide-in">
          <div className="p-4 space-y-1">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/my-account"
                  ? pathname === "/my-account"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-text-muted hover:text-text hover:bg-surface-hover"
                  )}
                >
                  <link.icon size={18} />
                  {link.label}
                </Link>
              );
            })}
            <div className="border-t border-border my-2" />
            <div className="px-4 py-2">
              <p className="text-sm font-medium text-text">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-text-muted">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-error hover:bg-error/10 transition-all"
            >
              <LogOut size={18} />
              Terminar Sessão
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
