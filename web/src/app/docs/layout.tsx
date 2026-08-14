import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { db } from "@/db";
import { user } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { Navbar as MyAccountNavbar } from "../my-account/components/Navbar";

export default async function DocsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await getSession();
	if (!session) {
		redirect("/login");
	}

	const foundUser = await db
		.select()
		.from(user)
		.where(eq(user.id, session.sub))
		.get();

	if (!foundUser) {
		redirect("/login");
	}
	return (
		<div className="min-h-screen">
			{foundUser ? <MyAccountNavbar /> : <Navbar />}
			<main className="">{children}</main>
			<Footer />
		</div>
	);
}
