import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../hooks";
import * as Lucide from "lucide-react";
import logoSrc from "../assets/logo.png";

const menuItems = [
  { to: "/cameras", icon: Lucide.Video, label: "Câmeras" },
  { to: "/people", icon: Lucide.Users, label: "Pessoas" },
  { to: "/notifications", icon: Lucide.Bell, label: "Notificações" },
  { to: "/panel/settings", icon: Lucide.Settings, label: "Configurações" },
];

export function FloatingNavbar() {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const navRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 16, y: 16 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragOffset = useRef({ x: 16, y: 16 });
  const hasMoved = useRef(false);

  const vw = typeof window !== "undefined" ? window.innerWidth : 1600;
  const vh = typeof window !== "undefined" ? window.innerHeight : 900;
  const isTop = pos.y < vh / 2;
  const isLeft = pos.x < vw / 2;

  const snapToCorner = useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const { x, y } = pos;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const corners = [
      { x: 16, y: 16 },
      { x: vw - w - 16, y: 16 },
      { x: 16, y: vh - h - 16 },
      { x: vw - w - 16, y: vh - h - 16 },
    ];
    type Corner = { x: number; y: number; dist: number };
    const nearest = corners.reduce<Corner>(
      (b, c) => {
        const d = (c.x - cx) ** 2 + (c.y - cy) ** 2;
        return d < b.dist ? { x: c.x, y: c.y, dist: d } : b;
      },
      { ...corners[0], dist: Infinity },
    );
    setPos({ x: nearest.x, y: nearest.y });
  }, [pos]);

  useEffect(() => {
    const el = btnRef.current;
    if (!el) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!(e.target as HTMLElement).closest("[data-drag-handle]")) return;
      hasMoved.current = false;
      isDragging.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY };
      dragOffset.current = { x: pos.x, y: pos.y };
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved.current = true;
      setPos({
        x: dragOffset.current.x + dx,
        y: dragOffset.current.y + dy,
      });
    };
    const onPointerUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      snapToCorner();
    };
    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [pos, snapToCorner]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onClickOutside);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onClickOutside);
    };
  }, [open]);

  const handleClick = () => {
    if (hasMoved.current) return;
    setOpen((v) => !v);
  };

  const isAdmin = !!user?.is_active;

  return (
    <motion.div
      ref={navRef}
      animate={{ left: pos.x, top: pos.y }}
      transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.5 }}
      className="fixed z-[999] select-none w-[52px] h-[52px]"
      style={{ touchAction: "none" }}
    >
      {/* Trigger — this is now the positioning context for the menu */}
      <div
        data-drag-handle
        ref={btnRef}
        onClick={handleClick}
        role="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Abrir menu"
        className="group relative w-[52px] h-[52px] flex items-center justify-center cursor-pointer active:cursor-grabbing rounded-2xl"
      >
        {/* Ambient glow, breathes when closed */}
        <motion.div
          aria-hidden
          className="absolute -inset-1 rounded-2xl bg-[#22D3EE]/25 blur-lg pointer-events-none"
          animate={open ? { opacity: 0.55, scale: 1 } : { opacity: [0.25, 0.4, 0.25], scale: 1 }}
          transition={
            open
              ? { duration: 0.2 }
              : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }
          }
        />

        {/* Surface */}
        <div
          className={`relative w-full h-full flex items-center justify-center rounded-2xl border transition-colors duration-200 ${open
              ? "bg-[#0B0E14]/90 border-[#22D3EE]/50"
              : "bg-[#11151D]/85 border-white/[0.08] group-hover:border-white/[0.16]"
            } backdrop-blur-xl backdrop-saturate-150 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)] group-active:scale-95 transition-transform`}
        >
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#22D3EE] opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22D3EE]" />
          </span>

          <img
            src={logoSrc}
            alt="Logo"
            draggable={false}
            className="relative w-8 h-auto z-10 pointer-events-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
          />
        </div>

        {/* Menu — positioned relative to the 52x52 trigger, not the outer wrapper */}
        <AnimatePresence>
          {open && (
            <motion.div
              role="menu"
              initial={{ opacity: 0, y: isTop ? -10 : 10, x: isLeft ? -10 : 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
              exit={{ opacity: 0, y: isTop ? -6 : 6, x: isLeft ? -6 : 6, scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="absolute min-w-[208px] p-1.5 rounded-2xl bg-[#0B0E14]/95 backdrop-blur-xl backdrop-saturate-150 border border-white/[0.08] shadow-[0_16px_40px_-12px_rgba(0,0,0,0.7)] overflow-hidden cursor-auto"
              style={{
                [isTop ? "top" : "bottom"]: "calc(100% + 10px)",
                [isLeft ? "left" : "right"]: 0,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-[#22D3EE]/40 to-transparent" />

              <nav className="flex flex-col">
                {menuItems.map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: isLeft ? -8 : 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.14 }}
                  >
                    <Link
                      to={item.to}
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className="group flex items-center gap-3 px-3 py-2.5 text-[13.5px] font-medium text-gray-400 hover:text-white rounded-xl transition-colors duration-150"
                    >
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.04] group-hover:bg-[#22D3EE]/15 text-gray-500 group-hover:text-[#22D3EE] transition-colors duration-150 shrink-0">
                        <item.icon size={16} strokeWidth={2} />
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  </motion.div>
                ))}

                {isAdmin && (
                  <>
                    <div className="my-1.5 mx-3 h-px bg-white/[0.07]" />
                    <motion.div
                      initial={{ opacity: 0, x: isLeft ? -8 : 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: menuItems.length * 0.03, duration: 0.14 }}
                    >
                      <a
                      href="/admin"
                      role="menuitem"
                      className="group flex items-center gap-3 px-3 py-2.5 text-[13.5px] font-medium text-amber-300/80 hover:text-amber-200 rounded-xl transition-colors duration-150"
                      >
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-400/10 group-hover:bg-amber-400/20 text-amber-400 transition-colors duration-150 shrink-0">
                        <Lucide.Shield size={16} strokeWidth={2} />
                      </span>
                      <span>Admin</span>
                    </a>
                  </motion.div>
              </>
                )}
            </nav>
            </motion.div>
          )}
      </AnimatePresence>
    </div>
    </motion.div >
  );
}