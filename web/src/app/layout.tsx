import type { Metadata } from "next";
import { ToastProvider } from "@/packages/ui";

import "./globals.css";

const siteUrl = "https://www.secureit.co";

export const metadata: Metadata = {
	metadataBase: new URL(siteUrl),
	title: {
		default: "SecureIT — Sistema de Vigilância Inteligente",
		template: "%s | SecureIT",
	},
	description:
		"Sistema de monitorização inteligente multi-plataforma. Reconhecimento facial, deteção de pessoas com YOLOv11, alertas em tempo real. Desktop, web e mobile.",
	keywords: [
		"vigilância",
		"segurança",
		"reconhecimento facial",
		"deteção de pessoas",
		"YOLO",
		"câmeras",
		"monitorização",
		"SecureIT",
		"Angola",
	],
	authors: [{ name: "SecureIT" }],
	creator: "SecureIT",
	openGraph: {
		type: "website",
		locale: "pt_PT",
		url: siteUrl,
		siteName: "SecureIT",
		title: "SecureIT — Sistema de Vigilância Inteligente",
		description:
			"Sistema de monitorização inteligente multi-plataforma com reconhecimento facial e deteção de pessoas.",
		images: [
			{
				url: "/opengraph-image",
				width: 1200,
				height: 630,
				alt: "SecureIT",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "SecureIT — Sistema de Vigilância Inteligente",
		description:
			"Sistema de monitorização inteligente multi-plataforma.",
		images: ["/opengraph-image"],
	},
	icons: {
		icon: "/logo.png",
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	alternates: {
		canonical: siteUrl,
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html
			lang="pt"
			className="scroll-smooth"
			data-scroll-behavior="smooth"
			suppressHydrationWarning
		>
			<head>
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{
						__html: JSON.stringify({
							"@context": "https://schema.org",
							"@type": "Organization",
							name: "SecureIT",
							url: siteUrl,
							logo: `${siteUrl}/logo.png`,
							description:
								"Sistema de vigilância inteligente multi-plataforma com reconhecimento facial e deteção de pessoas.",
							sameAs: [],
							contactPoint: {
								"@type": "ContactPoint",
								telephone: "+244-926-422-462",
								contactType: "customer service",
								availableLanguage: ["Portuguese"],
							},
						}),
					}}
				/>
			</head>
			<body className="min-h-screen bg-bg text-text antialiased font-sans">
					<ToastProvider>{children}</ToastProvider>
			</body>
		</html>
	);
}
