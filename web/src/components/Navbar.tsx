import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "./ThemeToggle"


export function Navbar({ inMyAccount = false }: { inMyAccount?: boolean }) {
  return (
    <nav className={inMyAccount ? `relative top-0 z-50 border-b` : `relative z-50`}>
      <div className={
        (!inMyAccount ? `absolute top-5 left-1/2 md:left-5 -translate-x-1/2 md:-translate-x-0` : "px-4 md:px-8") + 
        " flex items-center justify-between"
      }>
      <div className="flex gap-2 justify-center items-center">
        <Link
          href="/"
          className="flex items-center justify-center items-center gap-1.5 transition-colors"
        >
          <Image
            src="/logo.png"
            alt="SecureIT"
            width={40}
            height={40}
            className="h-6 md:h-8 w-auto" />
          <h1 className="hidden md:block text-2xl md:text-3xl font-bold leading-10 text-text tracking-tight">
            SecureIT
          </h1>
        </Link>
        <div class="min-h-8 w-[1px] bg-gray-300"></div>
        <h1 className="font-bold text-2xl md:text-3xl">Minha Conta</h1>
      </div>
        {
          inMyAccount && <div className="py-4"> 
        <ThemeToggle />
          </div>
        }
      </div>
    </nav>
  );
}
