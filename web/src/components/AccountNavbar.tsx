"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface AccountNavbarProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export function AccountNavbar({ user }: AccountNavbarProps) {
  const router = useRouter();

  return (
    <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 md:px-8 h-16 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-all"
            title="Voltar"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            onClick={() => router.forward()}
            className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-all"
            title="Avançar"
          >
            <ArrowRight size={18} />
          </button>
          <Link href="/" className="flex items-center gap-2 ml-2">
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
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-text-muted hidden sm:block">
            {user.firstName} {user.lastName}
          </span>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
