import { useRef, useCallback, type KeyboardEvent } from "react";

interface PinInputProps {
  onComplete?: (pin: string) => void;
}

export function PinInput({ onComplete }: PinInputProps) {
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
        const next = inputRefs[idx + 1].current;
        if (next) {
          next.value = "";
          next.focus();
        }
      }
      const pin = getPin();
      if (pin.length === 4) onComplete?.(pin);
    },
    [getPin, onComplete]
  );

  const handleKeyDown = useCallback(
    (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !e.currentTarget.value && idx > 0) {
        const prev = inputRefs[idx - 1].current;
        prev?.select();
      }
    },
    []
  );

  return (
    <div className="grid grid-cols-[repeat(4,1fr)_auto] gap-3 sm:gap-4 items-center">
      {inputRefs.map((ref, idx) => (
        <input
          key={idx}
          ref={ref}
          maxLength={1}
          placeholder="•"
          type="text"
          onChange={(e) => handleInput(idx, e)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          className="h-14 w-full bg-surface border border-border text-center text-text text-lg font-bold focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none transition-all caret-primary"
        />
      ))}
    </div>
  );
}
