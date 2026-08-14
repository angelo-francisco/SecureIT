import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

export default function DocsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="min-h-screen">
			<Navbar />
			<main className="pt-24 md:pt-28">{children}</main>
			<Footer />
		</div>
	);
}
