import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { user } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { Navbar } from "./components/Navbar";

export default async function MyAccountLayout({
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
		<div className="min-h-screen bg-bg text-text">
			<Navbar />
			<main className="px-4 pt-8 pb-10 md:px-8 md:pt-8 md:pb-12">
				{children}
			</main>
		</div>
	);
}
