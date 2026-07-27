import type { Metadata } from "next";
import { AboutContent } from "./AboutContent";

export const metadata: Metadata = {
	title: "Sobre Nós",
	description:
		"Conheça a SecureIT — missão, equipa e tecnologia por trás do sistema de vigilância inteligente multi-plataforma.",
	alternates: { canonical: "/about" },
	openGraph: {
		title: "Sobre Nós | SecureIT",
		description:
			"Conheça a SecureIT — missão, equipa e tecnologia por trás do sistema de vigilância inteligente.",
	},
};

export default function AboutPage() {
	return <AboutContent />;
}
