import { useState, useEffect, useRef, useCallback, type KeyboardEvent } from "react";
import { useAuth } from "../hooks";
import * as Lucide from "lucide-react";
import { Dialog, DialogContent } from "../ui";

function PinInput({ onComplete, error }: { onComplete: (pin: string) => void; error: string }) {
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const getPin = useCallback(() => {
    return inputRefs.map((ref) => ref.current?.value ?? "").join("");
  }, []);

  const handleInput = useCallback(
    (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val && idx < 3) {
        inputRefs[idx + 1].current?.focus();
      }
      const pin = getPin();
      if (pin.length === 4) onComplete(pin);
    },
    [getPin, onComplete]
  );

  const handleKeyDown = useCallback(
    (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !e.currentTarget.value && idx > 0) {
        inputRefs[idx - 1].current?.focus();
      }
    },
    []
  );

  return (
    <div className={`flex gap-3 justify-center ${error ? "animate-shake" : ""}`}>
      {inputRefs.map((ref, idx) => (
        <input
          key={idx}
          ref={ref}
          maxLength={1}
          placeholder=""
          type="password"
          onChange={(e) => handleInput(idx, e)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          className="h-14 w-14 bg-[#0d1420] border-2 border-border-light text-center text-text text-xl font-bold focus:border-primary focus:ring-4 focus:ring-primary/20 focus:outline-none transition-all duration-200 caret-transparent select-none [&:not(:placeholder-shown)]:border-primary/60"
          autoFocus={idx === 0}
          inputMode="numeric"
        />
      ))}
    </div>
  );
}

export function PinModal() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);
  const { verifyPin, pinVerified, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && !pinVerified) setOpen(true);
  }, [isAuthenticated, pinVerified]);

  const handlePinComplete = async (_pin: string) => {
    setError("");
    try {
      await verifyPin();
      setOpen(false);
    } catch {
      setError("PIN incorreto. Tente novamente.");
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="p-8 max-w-md"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <div className="relative">
          <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

          <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent rounded-full" />

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
              <Lucide.LockKeyhole className="text-primary" size={24} />
            </div>

            <h1 className="text-xl font-bold text-text">
              Tela Bloqueada
            </h1>
            <p className="text-sm text-text-muted mt-1.5 mb-8 max-w-[260px]">
              Insira o código de acesso para continuar
            </p>

            <PinInput onComplete={handlePinComplete} error={shaking ? error : ""} />

            {error && (
              <p className="mt-4 text-sm text-error flex items-center gap-1.5">
                <Lucide.AlertCircle size={14} />
                {error}
              </p>
            )}

            <span className="mt-6 text-xs text-text-muted/60 select-none">
              Esqueceu o PIN? Contacte o administrador
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
