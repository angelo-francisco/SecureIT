import * as Lucide from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

export type ViewId =
  | "cameras"
  | "camera-new"
  | "camera-view"
  | "camera-monitor"
  | "people"
  | "person-new"
  | "person-view"
  | "role-management"
  | "notifications"
  | "settings"
  | "license";

interface MenuItem {
  id: ViewId;
  icon: LucideIcon;
  label: string;
}

const menuItems: MenuItem[] = [
  { id: "cameras", icon: Lucide.Video, label: "Câmeras" },
  { id: "people", icon: Lucide.Users, label: "Pessoas" },
  { id: "notifications", icon: Lucide.Bell, label: "Notificações" },
  { id: "license", icon: Lucide.Key, label: "Licença" },
  { id: "settings", icon: Lucide.Settings, label: "Configurações" },
];

interface FloatingNavbarProps {
  activeView: ViewId | null;
  onSelect: (view: ViewId) => void;
}

export function FloatingNavbar({ activeView, onSelect }: FloatingNavbarProps) {
  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[997]"
    >
      <div className="flex items-center gap-1.5 px-2 py-2 rounded-2xl bg-[#0B0E14]/85 backdrop-blur-2xl backdrop-saturate-150 border border-white/[0.08] shadow-[0_8px_32px_-8px_rgba(0,0,0,0.6)]">
        {menuItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`
                relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl
                text-[13px] font-medium
                transition-all duration-200
                ${isActive
                  ? "text-white"
                  : "text-gray-400 hover:text-gray-200"
                }
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="fab-active-bg"
                  className="absolute inset-0 rounded-xl bg-[#22D3EE]/15 border border-[#22D3EE]/25"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <span className="relative flex items-center justify-center w-5 h-5">
                <item.icon size={17} strokeWidth={isActive ? 2.5 : 2} />
              </span>
              <span className="relative">{item.label}</span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
