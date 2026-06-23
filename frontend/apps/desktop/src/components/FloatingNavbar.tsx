import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../hooks";
import * as Lucide from "lucide-react";
import logoSrc from "../assets/logo.png";

export function FloatingNavbar() {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((s) => s.user);

  return (
    <div className="fixed top-4 left-4 z-[999] bg-surface-dark/60 backdrop-blur-xl backdrop-saturate-150 border border-gray-700 rounded-full shadow-xl flex flex-col items-center gap-2 p-3 select-none duration-300 ease-in-out">
      <div
        className="relative mt-1 w-10 h-10 flex items-center justify-center text-white font-bold cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <div className="absolute inset-0 rounded-full bg-[#2C9ED5]/70 blur-lg"></div>
        <img src={logoSrc} alt="Logo" className="relative w-8 h-auto z-10" />
      </div>
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          open ? "max-h-96 opacity-100 scale-100" : "max-h-0 opacity-0 scale-95"
        }`}
      >
        <div className="w-full h-px bg-border-dark mb-1"></div>
        <Link
          to="/cameras"
          className="flex items-center justify-center w-12 h-12 rounded-full hover:bg-[#2C9ED5]/20 transition-all duration-200"
        >
          <Lucide.Video size={20} />
        </Link>
        <Link
          to="/people"
          className="flex items-center justify-center w-12 h-12 rounded-full hover:bg-[#2C9ED5]/20 transition-all duration-200"
        >
          <Lucide.Users size={20} />
        </Link>
        <Link
          to="/notifications"
          className="relative flex items-center justify-center w-12 h-12 rounded-full hover:bg-[#2C9ED5]/20 transition-all duration-200"
        >
          <Lucide.Bell size={20} />
        </Link>
        <Link
          to="/panel/settings"
          className="flex items-center justify-center w-12 h-12 rounded-full hover:bg-[#2C9ED5]/20 transition-all duration-200"
        >
          <Lucide.Settings size={20} />
        </Link>
        {user?.is_active && (
          <a
            href="/admin"
            className="flex items-center justify-center w-12 h-12 rounded-full hover:bg-[#2C9ED5]/20 transition-all duration-200"
          >
            <Lucide.Shield size={20} />
          </a>
        )}
      </div>
    </div>
  );
}
