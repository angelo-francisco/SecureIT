interface FullLogoProps {
  className?: string;
}

export function FullLogo({ className }: FullLogoProps) {
  return (
    <div className={`flex items-center gap-1 ${className ?? ""}`}>
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-[#2C9ED5]/70 blur-md" />
        <div className="relative w-4 h-4 rounded-full bg-primary z-10 flex items-center justify-center">
          <span className="text-white text-[8px] font-bold">S</span>
        </div>
      </div>
      <h1 className="text-text text-sm font-bold leading-tight tracking-[-0.015em] ml-[3px]">
        SecureIT
      </h1>
    </div>
  );
}
