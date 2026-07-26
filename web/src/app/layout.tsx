import type { Metadata } from "next";
import { ToastProvider } from "@/packages/ui";
import "./globals.css";

export const metadata: Metadata = {
	title: "SecureIT",
	description: "Plataforma de Monitoramento Inteligente",
	icons: {
		icon: "/logo.png",
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
			<body className="min-h-screen bg-bg text-text antialiased font-sans">
				<ToastProvider>{children}</ToastProvider>
			</body>
		</html>
	);
}
