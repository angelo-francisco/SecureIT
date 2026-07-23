interface FullLoaderProps {
  imageSrc?: string;
  text?: string;
  show?: boolean;
}

export function FullLoader({
  imageSrc = "/logo.png",
  text = "SecureIT",
  show = true,
}: FullLoaderProps) {
  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center text-center bg-bg transition-opacity duration-500 ${
        show ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="flex items-center gap-3 mb-4">
        <img src={imageSrc} alt={text} className="w-8 h-auto" />
        <h1 className="text-text text-3xl font-bold">{text}</h1>
      </div>
      <div className="fl-loader" />
      <style>{`
        .fl-loader {
          width: 300px;
          height: 4px;
          border-radius: 30px;
          background-color: var(--border);
          position: relative;
          overflow: hidden;
        }
        .fl-loader::before {
          content: "";
          position: absolute;
          background: var(--primary);
          top: 0;
          left: 0;
          width: 0%;
          height: 100%;
          border-radius: 30px;
          animation: fl-moving 1s ease-in-out infinite;
        }
        @keyframes fl-moving {
          50% { width: 100%; }
          100% { width: 0; right: 0; left: unset; }
        }
      `}</style>
    </div>
  );
}
