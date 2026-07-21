import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "./ThemeToggle"


export function Navbar({ inMyAccount = false }: { inMyAccount?: boolean }) {
  return (
    <nav className={inMyAccount ? `sticky top-0 z-50` : `relative z-50`}>
      <div className={(!inMyAccount ? `absolute top-5 left-5 right-5` : "px-8 py-4") + " flex items-center justify-between"}>
        <Link
          href="/"
          className="flex items-center justify-center items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
        >
          <Image
            src="/logo.png"
            alt="SecureIT"
            width={40}
            height={40}
            className="h-10 w-auto" />
          <h1 className="text-3xl font-bold leading-10 text-text tracking-tight">
            SecureIT
          </h1>
        </Link>
        <ThemeToggle />
      </div>
    </nav>
  );
}
