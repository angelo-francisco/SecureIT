"use client";

import { useRef, useEffect, useState } from "react";

interface CountUpProps {
	end: number;
	duration?: number;
	prefix?: string;
	suffix?: string;
	decimals?: number;
	className?: string;
}

export function CountUp({
	end,
	duration = 2000,
	prefix = "",
	suffix = "",
	decimals = 0,
	className = "",
}: CountUpProps) {
	const ref = useRef<HTMLSpanElement>(null);
	const [value, setValue] = useState(0);
	const [started, setStarted] = useState(false);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting && !started) {
					setStarted(true);
					observer.unobserve(el);
				}
			},
			{ threshold: 0.3 },
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, [started]);

	useEffect(() => {
		if (!started) return;

		const startTime = performance.now();
		const step = (now: number) => {
			const elapsed = now - startTime;
			const progress = Math.min(elapsed / duration, 1);
			const eased = 1 - (1 - progress) ** 3;
			setValue(eased * end);
			if (progress < 1) requestAnimationFrame(step);
		};

		requestAnimationFrame(step);
	}, [started, end, duration]);

	return (
		<span ref={ref} className={className}>
			{prefix}
			{decimals > 0 ? value.toFixed(decimals) : Math.round(value)}
			{suffix}
		</span>
	);
}
