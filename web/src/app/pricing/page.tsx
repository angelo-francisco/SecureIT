import type { Metadata } from "next";
import { PricingPageContent } from "./PricingPage";

export const metadata: Metadata = {
	title: "Preços",
	description:
		"Planos de vigilância inteligente SecureIT. B2C para particulares e B2B para empresas. Câmeras ilimitadas, reconhecimento facial e alertas em tempo real.",
	alternates: { canonical: "/pricing" },
	openGraph: {
		title: "Preços | SecureIT",
		description:
			"Planos de vigilância inteligente. B2C para particulares e B2B para empresas.",
	},
};

export default function PricingPage() {
	return <PricingPageContent />;
}
