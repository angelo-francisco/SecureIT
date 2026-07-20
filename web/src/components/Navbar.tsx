"use client";

import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "./ThemeToggle";


export function Navbar() {
  return (
    <nav className="relative z-50 ">
      <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
        >
          <div className="flex items-center justify-center gap-1">
            <Image src="/logo.png" alt="SecureIT" width={25} height={25} loading="eager" fetchPriority="high" className="h-8 w-auto" />
            <h1 className="text-2xl font-bold leading-10 text-text tracking-tight">
              SecureIT
            </h1>
          </div>
        </Link>
        <ThemeToggle />
      </div>
    </nav>
  );
}
