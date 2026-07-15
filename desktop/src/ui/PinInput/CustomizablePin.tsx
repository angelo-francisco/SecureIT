import { useState, useRef, useCallback, useEffect, type KeyboardEvent } from "react";

interface CustomizablePinProps {
  pinClass?: string;
  finalInputId?: string;
  pinInputName?: string;
  onChange?: (pin: string) => void;
  error?: boolean;
}

export function CustomizablePin({
  pinClass = "pin-input-custom",
  finalInputId = "final-pin-input",
  pinInputName = "pin",
  onChange,
  error,
}: CustomizablePinProps) {
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (error) {
      setShake(true);
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const update = useCallback(() => {
    const pin = inputRefs.map((r) => r.current?.value ?? "").join("");
    onChange?.(pin);
  }, [onChange]);

  const handleInput = useCallback(
    (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/\D/g, "");
      e.target.value = val;
      if (val && idx < 3) {
        const next = inputRefs[idx + 1].current;
        if (next) {
          next.value = "";
          next.focus();
        }
      }
      update();
    },
    [update]
  );

  const handleKeyDown = useCallback(
    (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !e.currentTarget.value && idx > 0) {
        inputRefs[idx - 1].current?.select();
      }
    },
    []
  );

  return (
    <div className={`grid grid-cols-[repeat(4,1fr)_auto] gap-3 sm:gap-4 items-center ${shake ? "animate-shake" : ""}`}>
      {inputRefs.map((ref, idx) => (
        <input
          key={idx}
          ref={ref}
          maxLength={1}
          placeholder="•"
          type="text"
          inputMode="numeric"
          className={`h-14 w-full rounded-lg text-center text-lg font-bold focus:outline-none transition-all caret-primary ${pinClass} ${error ? "!border-error" : ""}`}
          onChange={(e) => handleInput(idx, e)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
        />
      ))}
      <input type="hidden" id={finalInputId} name={pinInputName} />
    </div>
  );
}
