"use client";

import { useRef, useState, useCallback, type KeyboardEvent, type ClipboardEvent } from "react";

interface PinInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  onAnimationEnd?: () => void;
}

export function PinInput({
  value,
  onChange,
  length = 4,
  disabled = false,
  autoFocus = true,
  className = "",
  onAnimationEnd = () => {}
}: PinInputProps) {
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const focusInput = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, length - 1));
      setActiveIndex(clamped);
      inputRefs.current[clamped]?.focus();
      inputRefs.current[clamped]?.select();
    },
    [length]
  );

  const handleChange = useCallback(
    (index: number, digit: string) => {
      if (disabled) return;
      const clean = digit.replace(/\D/g, "").slice(-1);
      const chars = value.split("");

      while (chars.length < length) chars.push("");
      chars[index] = clean;

      const next = chars.join("").slice(0, length);
      onChange(next);

      if (clean && index < length - 1) {
        focusInput(index + 1);
      }
    },
    [disabled, value, length, onChange, focusInput]
  );

  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return;

      if (e.key === "Backspace") {
        e.preventDefault();
        const chars = value.split("");
        while (chars.length < length) chars.push("");

        if (chars[index]) {
          chars[index] = "";
          onChange(chars.join(""));
        } else if (index > 0) {
          chars[index - 1] = "";
          onChange(chars.join(""));
          focusInput(index - 1);
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault();
        focusInput(index - 1);
      } else if (e.key === "ArrowRight" && index < length - 1) {
        e.preventDefault();
        focusInput(index + 1);
      }
    },
    [disabled, value, length, onChange, focusInput]
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      if (disabled) return;
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
      if (pasted) {
        onChange(pasted);
        focusInput(Math.min(pasted.length, length - 1));
      }
    },
    [disabled, length, onChange, focusInput]
  );

  const digits = value.split("");
  while (digits.length < length) digits.push("");

  return (
    <div className={`flex items-center gap-2.5 ${className}`} onAnimationEnd={onAnimationEnd}>
      {Array.from({ length }).map((_, i) => {
        const filled = !!digits[i];
        const isActive = i === activeIndex && focused;

        return (
          <div
            key={i}
            className={`
              relative w-16 h-14 flex items-center justify-center
              transition-all duration-200 ease-out border
              ${isActive
                ? "bg-surface ring-2 ring-primary/40 scale-105"
                : filled
                  ? "bg-surface-hover"
                  : "bg-surface-hover/60"
              }
            `}
            onClick={() => focusInput(i)}
          >
            <input
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus={autoFocus && i === 0}
              disabled={disabled}
              value={digits[i]}
              onFocus={() => { setFocused(true); setActiveIndex(i); }}
              onBlur={() => { setFocused(false); setActiveIndex(-1); }}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {filled && (
              <div className="w-3 h-3 rounded-full bg-text transition-all duration-200" />
            )}
            {/* {isActive && (
              <div className="absolute inset-0 ring-1 ring-primary/20 pointer-events-none" />
            )} */}
          </div>
        );
      })}
    </div>
  );
}
