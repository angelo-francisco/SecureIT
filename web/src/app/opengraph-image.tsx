import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "SecureIT — Sistema de Vigilância Inteligente";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
	return new ImageResponse(
		(
			<div
				style={{
					background: "#202634",
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					position: "relative",
				}}
			>
				<div
					style={{
						position: "absolute",
						inset: 0,
						background:
							"radial-gradient(circle at 50% 30%, rgba(44,158,213,0.25) 0%, transparent 60%)",
					}}
				/>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 16,
						zIndex: 1,
					}}
				>
					<div
						style={{
							width: 64,
							height: 64,
							borderRadius: 16,
							background: "#2C9ED5",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<svg
							width="36"
							height="36"
							viewBox="0 0 24 24"
							fill="none"
							stroke="white"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
						</svg>
					</div>
					<span
						style={{
							fontSize: 52,
							fontWeight: 800,
							color: "#ffffff",
							fontFamily: "system-ui",
							letterSpacing: -1,
						}}
					>
						SecureIT
					</span>
				</div>
				<p
					style={{
						fontSize: 24,
						color: "#9dabb9",
						marginTop: 16,
						zIndex: 1,
						fontFamily: "system-ui",
					}}
				>
					Sistema de Vigilância Inteligente
				</p>
				<p
					style={{
						fontSize: 18,
						color: "#2C9ED5",
						marginTop: 8,
						zIndex: 1,
						fontFamily: "system-ui",
					}}
				>
					Desktop · Web · Mobile
				</p>
			</div>
		),
		{ ...size },
	);
}
