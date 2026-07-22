import { Link } from 'react-router-dom';
import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
  return (
    <nav className="relative z-50 select-none">
      <div className="absolute top-5 left-5 right-5 px-5 py-3 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center justify-center items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
        >
          <img
            src="/logo.png"
            alt="SecureIT"
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
