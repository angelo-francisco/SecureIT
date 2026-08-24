import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { getSession } from "@/lib/auth";
import { Navbar as MyAccountNavbar } from "../my-account/components/Navbar";

export default async function DocsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await getSession();

	return (
		<div className="min-h-screen">
			{session ? <MyAccountNavbar /> : <Navbar />}
			<main>{children}</main>
			<Footer />
		</div>
	);
}
