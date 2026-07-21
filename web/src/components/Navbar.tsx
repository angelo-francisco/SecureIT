import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "./ThemeToggle"


export function Navbar() {
  return (
    <nav className="relative z-50 ">
      <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
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
