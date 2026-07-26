import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar({ inMyAccount = false }: { inMyAccount?: boolean }) {
	if (inMyAccount)
		return (
			<nav className="relative top-0 z-50 py-5">
				<div
					className={
						"px-4 md:px-4" +
						" flex items-center justify-center md:justify-between"
					}
				>
					<div className="flex gap-2 justify-center items-center">
						<Link
							href="/"
							className="flex items-center justify-center items-center gap-1.5 transition-colors"
						>
							<Image
								src="/logo.png"
								alt="SecureIT"
								width={40}
								height={40}
								className="h-6 md:h-8 w-auto"
							/>
							<h1 className="text-2xl md:text-3xl font-bold leading-10 text-text tracking-tight">
								SecureIT
							</h1>
						</Link>
						<div className="min-h-8 w-[1px] bg-gray-300"></div>
						<h1 className="font-bold text-2xl md:text-3xl">Minha Conta</h1>
					</div>
				</div>
			</nav>
		);

	return (
		<nav className="relative z-50">
			<div className="absolute top-5 left-1/2 md:left-5 -translate-x-1/2 md:-translate-x-0 flex items-center justify-between">
				<Link
					href="/"
					className="flex items-center justify-center items-center gap-1.5 transition-colors"
				>
					<Image
						src="/logo.png"
						alt="SecureIT"
						width={40}
						height={40}
						className="h-8 w-auto"
					/>
					<h1 className="text-3xl font-bold leading-10 text-text tracking-tight">
						SecureIT
					</h1>
				</Link>
			</div>
		</nav>
	);
}
