"use client";

import {
	type ClipboardEvent,
	type KeyboardEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { cn } from "../../lib/cn";

interface CodeInputProps {
	value: string;
	onChange: (value: string) => void;
	length?: number;
	disabled?: boolean;
	autoFocus?: boolean;
	className?: string;
}

export function CodeInput({
	value,
	onChange,
	length = 6,
	disabled = false,
	autoFocus = true,
	className = "",
}: CodeInputProps) {
	const [activeIndex, setActiveIndex] = useState(-1);
	const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

	const focusInput = useCallback(
		(index: number) => {
			const clamped = Math.max(0, Math.min(index, length - 1));
			setActiveIndex(clamped);
			inputRefs.current[clamped]?.focus();
			inputRefs.current[clamped]?.select();
		},
		[length],
	);

	useEffect(() => {
		if (autoFocus && !disabled) focusInput(0);
	}, [autoFocus, disabled, focusInput]);

	const handleChange = useCallback(
		(index: number, digit: string) => {
			if (disabled) return;
			const clean = digit.replace(/\D/g, "").slice(-1);
			const chars = value.split("");
			while (chars.length < length) chars.push("");
			chars[index] = clean;
			const next = chars.join("").slice(0, length);
			onChange(next);
			if (clean && index < length - 1) focusInput(index + 1);
		},
		[disabled, value, length, onChange, focusInput],
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
		[disabled, value, length, onChange, focusInput],
	);

	const handlePaste = useCallback(
		(e: ClipboardEvent<HTMLInputElement>) => {
			if (disabled) return;
			e.preventDefault();
			const pasted = e.clipboardData
				.getData("text")
				.replace(/\D/g, "")
				.slice(0, length);
			if (pasted) {
				onChange(pasted);
				focusInput(Math.min(pasted.length, length - 1));
			}
		},
		[disabled, length, onChange, focusInput],
	);

	const digits = value.split("");
	while (digits.length < length) digits.push("");

	return (
		<div className={cn("flex items-center justify-center gap-2.5", className)}>
			{Array.from({ length }).map((_, i) => {
				const filled = !!digits[i];
				const isActive = i === activeIndex;

				return (
					<div
						key={i}
						className={cn(
							"relative w-12 h-14 flex items-center justify-center border transition-all duration-200 ease-out sm:w-14",
							isActive
								? "border-primary ring-2 ring-primary/40 scale-105"
								: filled
									? "border-border bg-surface-hover"
									: "border-border bg-surface-hover/60",
						)}
					>
						<input
							ref={(el) => {
								inputRefs.current[i] = el;
							}}
							type="text"
							inputMode="numeric"
							autoComplete="one-time-code"
							disabled={disabled}
							value={digits[i]}
							onFocus={() => setActiveIndex(i)}
							onBlur={() => setActiveIndex(-1)}
							onChange={(e) => handleChange(i, e.target.value)}
							onKeyDown={(e) => handleKeyDown(i, e)}
							onPaste={handlePaste}
							className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
						/>
						<span
							className={cn(
								"text-xl font-semibold tabular-nums",
								filled ? "text-text" : "text-text-muted",
							)}
						>
							{filled ? digits[i] : "•"}
						</span>
					</div>
				);
			})}
		</div>
	);
}
