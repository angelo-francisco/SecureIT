import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { db } from "@/db";
import { user } from "@/db/schema";
import { getSession } from "@/lib/auth";

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
			<Navbar inMyAccount={true} />
			<main className="max-w-7xl mx-auto px-4 md:px-8 py-2 md:py-6">
				{children}
			</main>
		</div>
	);
}
