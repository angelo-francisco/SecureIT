import type { ReactNode } from "react";

interface MarqueeProps {
	children: ReactNode;
	className?: string;
	speed?: number;
}

export function Marquee({ children, className = "", speed = 30 }: MarqueeProps) {
	return (
		<div className={`overflow-hidden ${className}`}>
			<div
				className="marquee-container"
				style={{ animationDuration: `${speed}s` }}
			>
				<div className="flex shrink-0">{children}</div>
				<div className="flex shrink-0" aria-hidden>
					{children}
				</div>
			</div>
		</div>
	);
}
