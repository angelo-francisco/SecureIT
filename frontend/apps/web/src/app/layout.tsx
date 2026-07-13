import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SecureIT - Sistema de Segurança Inteligente",
  description:
    "Sistema de monitorização e segurança com reconhecimento facial e detecção de pessoas.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body className="min-h-screen bg-[#030712] text-gray-50 antialiased">
        {children}
      </body>
    </html>
  );
}
