"use client";

import { type ReactNode, useEffect, useRef } from "react";

interface ParallaxLayerProps {
	children?: ReactNode;
	className?: string;
	speed?: "slow" | "normal";
}

export function ParallaxLayer({
	children,
	className = "",
	speed = "normal",
}: ParallaxLayerProps) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
		if (mediaQuery.matches) return;

		const hasScrollTimeline = CSS.supports("animation-timeline", "scroll()");
		if (hasScrollTimeline) return;

		const maxShift = speed === "slow" ? 40 : 80;

		function onScroll() {
			if (!el) return;
			const rect = el.getBoundingClientRect();
			const windowH = window.innerHeight;
			const progress = (windowH - rect.top) / (windowH + rect.height);
			const offset = (progress - 0.5) * maxShift;
			el.style.transform = `translateY(${offset}px)`;
		}

		window.addEventListener("scroll", onScroll, { passive: true });
		onScroll();
		return () => window.removeEventListener("scroll", onScroll);
	}, [speed]);

	const scrollClass =
		speed === "slow" ? "parallax-layer-slow" : "parallax-layer";

	return (
		<div ref={ref} className={`${scrollClass} ${className}`}>
			{children ?? null}
		</div>
	);
}
