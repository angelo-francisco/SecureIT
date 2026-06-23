import { Link, useLocation } from "react-router-dom";
import { FullLogo } from "../ui";
import * as Lucide from "lucide-react";
import { useAuthStore } from "../hooks";

const navLinks = [
  { to: "/panel", icon: Lucide.Monitor, label: "Painel" },
  { to: "/cameras", icon: Lucide.Video, label: "Câmaras" },
  { to: "/people", icon: Lucide.Users, label: "Pessoas" },
  { to: "/notifications", icon: Lucide.Bell, label: "Notificações" },
  { to: "/panel/settings", icon: Lucide.Settings, label: "Configurações" },
];

export function Navbar() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  const isActive = (path: string) => {
    if (path === "/panel") return location.pathname === "/panel";
    return location.pathname.startsWith(path);
  };

  return (
    <header className="relative z-10 flex items-center justify-between whitespace-nowrap border-b border-solid border-border-light bg-bg/40 px-4 lg:px-10 py-5 shadow-sm">
      <Link to="/panel">
        <FullLogo />
      </Link>
      <nav className="hidden md:flex items-center gap-5 md:gap-9">
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`flex items-center gap-1 text-lg font-medium leading-normal transition-colors ${
              isActive(link.to)
                ? "text-text"
                : "text-text-muted hover:text-text"
            }`}
          >
            <link.icon size={20} />
            <span className="hidden sm:flex">{link.label}</span>
          </Link>
        ))}
        {user?.is_active && (
          <a
            href="/admin"
            className="flex items-center gap-1 text-text-muted hover:text-text text-lg font-medium leading-normal transition-colors"
          >
            <Lucide.Shield size={20} />
            <span className="hidden sm:flex">Admin</span>
          </a>
        )}
      </nav>
    </header>
  );
}
