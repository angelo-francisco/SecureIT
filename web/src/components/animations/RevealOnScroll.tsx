"use client";

import { type ReactNode, useEffect, useRef } from "react";

interface RevealOnScrollProps {
	children: ReactNode;
	className?: string;
	variant?: "up" | "left" | "right" | "scale";
	delay?: number;
}

export function RevealOnScroll({
	children,
	className = "",
	variant = "up",
	delay = 0,
}: RevealOnScrollProps) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
		if (mediaQuery.matches) return;

		const hasScrollTimeline = CSS.supports("animation-timeline", "view()");
		if (hasScrollTimeline) return;

		el.style.opacity = "0";
		el.style.transform =
			variant === "left"
				? "translateX(-48px)"
				: variant === "right"
					? "translateX(48px)"
					: variant === "scale"
						? "scale(0.92)"
						: "translateY(48px)";
		el.style.transition = `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					el.style.opacity = "1";
					el.style.transform =
						variant === "scale" ? "scale(1)" : "translate(0)";
					observer.unobserve(el);
				}
			},
			{ threshold: 0.1 },
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, [variant, delay]);

	const scrollClass =
		variant === "left"
			? "reveal-left"
			: variant === "right"
				? "reveal-right"
				: variant === "scale"
					? "reveal-scale"
					: "reveal-on-scroll";

	return (
		<div ref={ref} className={`${scrollClass} ${className}`}>
			{children}
		</div>
	);
}
