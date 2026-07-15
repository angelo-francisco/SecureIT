import logoSrc from "../../assets/logo.png";

export function FullLogo() {
  return (
    <div className="flex items-center gap-1">
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-[#2C9ED5]/70 blur-md"></div>
        <img
          src={logoSrc}
          alt="Logo"
          className="relative w-4 h-auto z-10"
        />
      </div>
      <h1 className="text-text text-sm font-bold leading-tight tracking-[-0.015em] ml-[3px]">
        SecureIT
      </h1>
    </div>
  );
}
