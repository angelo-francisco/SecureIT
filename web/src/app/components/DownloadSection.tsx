"use client";

import { useState } from "react";
import { RevealOnScroll } from "@/components/animations/RevealOnScroll";
import { TurnstileModal } from "./TurnstileModal";
import Image from "next/image";

const RELEASES_URL = "https://github.com/angelo-francisco/SecureIT/releases";

const platforms = [
	{
		name: "macOS",
		arch: "Apple Silicon & Intel",
		icon: (
			<Image
				src={"/apple.png"}
				alt={"apple"}
				width={45}
				height={45}
				className="dark:invert"
			/>
		)
	},
	{
		name: "Windows",
		arch: "x86_64 ou & ARM64",
		icon: (
			<Image
				src={"/windows.png"}
				alt={"apple"}
				width={45}
				height={45}
			/>
		)
	},
	{
		name: "Linux",
		arch: ".deb & .AppImage",
		icon: (
			<Image
				src={"/linux.png"}
				alt={"apple"}
				width={45}
				height={45}
			/>
		)
	},
];

export function DownloadSection() {
	const [modalOpen, setModalOpen] = useState(false);

	return (
		<>
			<section className="py-32 px-8 bg-surface/20">
				<div className="max-w-5xl mx-auto text-center">
					<RevealOnScroll>
						<h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
							Descarregue o SecureIT
						</h2>
						<p className="text-text-muted text-lg max-w-xl mx-auto mb-16">
							Disponível para Windows, Linux e macOS
						</p>
					</RevealOnScroll>

					<div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
						{platforms.map((platform) => (
							<RevealOnScroll key={platform.name} variant="scale">
								<button
									onClick={() => setModalOpen(true)}
									className="w-full card-sharp p-8 flex items-center gap-4 hover:border-primary/40 transition-all cursor-pointer"
								>
									<div className="text-primary/80">
										{platform.icon}
									</div>
									<div className="text-left">
										<p className="text-lg font-bold text-text">
											{platform.name}
										</p>
										<p className="text-sm text-text-muted mt-1">
											{platform.arch}
										</p>
									</div>
								</button>
							</RevealOnScroll>
						))}
					</div>
				</div>
			</section>

			<TurnstileModal
				open={modalOpen}
				onClose={() => setModalOpen(false)}
				downloadUrl={RELEASES_URL}
			/>
		</>
	);
}
