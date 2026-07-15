import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SecureIT - Sistema de Seguranca Inteligente",
  description:
    "Sistema de monitorizacao e seguranca com reconhecimento facial e deteccao de pessoas.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" className="dark">
      <body
        className={`min-h-screen bg-bg text-text antialiased font-sans ${inter.variable} ${spaceGrotesk.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
