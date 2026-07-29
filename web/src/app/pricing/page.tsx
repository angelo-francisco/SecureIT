import type { Metadata } from "next";
import { PricingPageContent } from "./PricingPage";

export const metadata: Metadata = {
	title: "Licenças",
	description:
		"Licença SecureIT — acesso completo a todas as funcionalidades. Câmeras ilimitadas, reconhecimento facial, alertas em tempo real e análise comportamental.",
	alternates: { canonical: "/pricing" },
	openGraph: {
		title: "Licenças | SecureIT",
		description:
			"Licença única com tudo incluído. Câmeras ilimitadas, reconhecimento facial e alertas em tempo real.",
	},
};

export default function PricingPage() {
	return <PricingPageContent />;
}
