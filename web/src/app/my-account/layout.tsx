import { eq } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { user } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { HeaderActions } from "./components/HeaderActions";

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
			<header className="left-0 top-0 z-50 w-full p-4 md:fixed md:p-6">
				<div className="flex items-center justify-between">
					<Link href="/" className="flex items-center gap-2.5">
						<Image
							src="/logo.png"
							alt="SecureIT"
							width={40}
							height={40}
							className="h-7 w-auto md:h-9"
						/>
						<span className="text-3xl font-bold tracking-tight text-text md:text-4xl">
							SecureIT
						</span>
					</Link>
					<HeaderActions />
				</div>
			</header>
			<main className="px-4 pt-8 pb-10 md:px-8 md:pt-32 md:pb-12">
				{children}
			</main>
		</div>
	);
}
