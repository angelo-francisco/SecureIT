"use client";

import { useState } from "react";
import { RevealOnScroll } from "@/components/animations/RevealOnScroll";
import { TurnstileModal } from "@/components/TurnstileModal";

const RELEASES_URL = "https://github.com/angelo-francisco/SecureIT/releases";

const platforms = [
	{
		name: "macOS",
		arch: "Apple Silicon & Intel",
		icon: (
			<svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
				<path d="M17.05 12.2c-.02-2.53 1.48-4.8 3.78-5.96-1.42-2.04-3.6-3.2-5.8-3.25-2.44-.24-4.8 1.4-6.04 1.4-1.27 0-3.2-1.38-5.28-1.34-2.73.03-5.26 1.6-6.66 4.06-2.87 5.03-.74 12.44 2.02 16.53 1.36 1.96 2.98 4.16 5.12 4.1 2.04-.08 2.82-1.32 5.3-1.32 2.47 0 3.17 1.32 5.34 1.28 2.2-.04 3.6-2.02 4.94-4 1.54-2.26 2.16-4.46 2.2-4.57-2.46-1.06-3.98-3.38-4.05-5.93zM14.64 3.8c1.08-1.28 1.7-2.97 1.52-4.7-1.48.1-3.12.96-4.1 2.26-.98 1.28-1.5 2.92-1.32 4.58 1.42.14 2.87-.7 3.9-2.14z"/>
			</svg>
		),
	},
	{
		name: "Windows",
		arch: "x64",
		icon: (
			<svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
				<path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
			</svg>
		),
	},
	{
		name: "Linux",
		arch: ".deb & .AppImage",
		icon: (
			<svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
				<path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm-1.23 3.34c.22-.44.72-.73 1.23-.73.52 0 .98.31 1.2.76.22.46.14 1-.2 1.36-.34.37-.89.51-1.38.36-.38-.12-.67-.43-.78-.8-.12-.38-.03-.79.24-1.07l-.31.12zM6.39 14c-.59.2-1.36.62-1.36 1.37 0 .27.1.55.32.77.37.37.99.42 1.47.42.83 0 1.66-.15 2.58-.36.64-.15 1.29-.36 1.94-.56l.33-.11c.39-.13.77-.28 1.15-.44.29-.12.57-.26.85-.4l.61-.31c.54-.28.95-.68 1.12-1.18.16-.48.08-.98-.25-1.37-.33-.38-.82-.56-1.36-.48-.52.07-.97.36-1.3.77-.24.31-.37.67-.4 1.04-.02.24 0 .48.06.71-.44.26-.92.44-1.4.56-.82.2-1.66.1-2.34.08.14-.56-.05-1.12-.44-1.53-.39-.41-.93-.62-1.48-.56-.5.05-.95.3-1.26.68-.36.42-.48.94-.36 1.44.01.02.01.04.02.06zm5.65 3.44c-.86.27-1.76.42-2.66.44-.53.01-1.06-.03-1.58-.11-.28-.05-.57-.11-.85-.19l.11-.07c.59-.37 1.24-.62 1.92-.76.68-.14 1.38-.17 2.06-.08.54.08 1.12.15 1.66.35.19.07.38.16.56.26.54.22.99.63 1.13 1.16.13.48.03.97-.27 1.22-.3.25-.81.25-1.29.17-.28-.05-.56-.14-.72-.26-.16-.13-.21-.31-.16-.49.05-.18.19-.3.35-.38.17-.08.36-.1.45-.04.12.08.14.22.11.33-.02.08-.07.14-.13.17.07.05.16.09.26.11.15.03.29.01.36-.07.09-.11.04-.31-.14-.43-.19-.13-.5-.17-.76-.11-.25.06-.43.2-.46.36-.03.15.08.28.27.35.13.05.3.07.46.05l.03.01c.23.01.44-.05.55-.16.05-.06.08-.13.08-.2l-.01-.03c-.05-.18-.27-.33-.56-.37-.29-.05-.59.03-.74.19-.08.09-.13.19-.13.28 0 .1.06.17.14.22.08.05.19.08.3.09-.17.02-.33-.01-.44-.09-.07-.05-.11-.12-.1-.19 0-.07.06-.14.15-.2.12-.09.3-.14.49-.14.19 0 .37.05.5.14.13.09.2.21.17.33-.03.12-.16.22-.34.27-.18.05-.39.04-.54-.03-.09-.04-.16-.11-.17-.19 0-.04.02-.08.05-.11-.03.01-.05.03-.06.06-.03.08.01.18.1.26.09.08.23.13.38.13.15 0 .3-.04.4-.12.11-.08.15-.19.1-.29-.04-.1-.16-.16-.3-.18-.03 0-.06 0-.09.01z"/>
			</svg>
		),
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

					<div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
						{platforms.map((platform) => (
							<RevealOnScroll key={platform.name} variant="scale">
								<button
									onClick={() => setModalOpen(true)}
									className="w-full card-sharp p-8 flex flex-col items-center gap-4 hover:border-primary/40 transition-all cursor-pointer"
								>
									<div className="text-primary/80">{platform.icon}</div>
									<div>
										<p className="text-lg font-bold text-text">
											{platform.name}
										</p>
										<p className="text-xs text-text-muted mt-1">
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
