import { Link } from 'react-router-dom';

export function Navbar() {
  return (
    <nav className="relative z-50 select-none">
      <div className="absolute top-5 left-1/2 md:left-5 -translate-x-1/2 md:-translate-x-0 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center justify-center items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
        >
          <img
            src="/logo.png"
            alt="SecureIT"
            className="h-8 w-auto" />
          <h1 className="text-3xl font-bold leading-10 text-text tracking-tight">
            SecureIT
          </h1>
        </Link>
        {/*<ThemeToggle />*/}
      </div>
    </nav>
  );
}
