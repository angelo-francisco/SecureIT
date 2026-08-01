"use client";

import { useState } from "react";
import { RevealOnScroll } from "@/components/animations/RevealOnScroll";
import Image from "next/image";

const getDownloadLink = (executableName: string) =>
	"https://github.com/angelo-francisco/SecureIT/releases/latest/download/" + executableName

const platforms = [
	// {
	// 	name: "macOS",
	// 	arch: "Apple Silicon & Intel",
	// 	icon: (
	// 		<Image
	// 			src={"/apple.png"}
	// 			alt={"apple"}
	// 			width={45}
	// 			height={45}
	// 			className="dark:invert"
	// 		/>
	// 	),
	// 	link: ""
	// },
	{
		name: "Windows",
		arch: [
			{
				name: ".exe",
				link: getDownloadLink("SecureIT.exe"),
			},
			{
				name: ".msi",
				link: getDownloadLink("SecureIT.msi"),
			},
		],
		icon: <Image src={"/windows.png"} alt={"apple"} width={45} height={45} />,
		link: "",
	},
	{
		name: "Linux",
		arch: [
			{
				name: ".deb",
				link: getDownloadLink("SecureIT.deb"),
			},
			// {
			// 	name: ".AppImage",
			// 	link: getDownloadLink("SecureIT_amd64.AppImage"),
			// },
		],
		icon: <Image src={"/linux.png"} alt={"apple"} width={45} height={45} />,
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

					<div className="w-full flex items-center justify-center flex-col md:flex-row gap-6 max-w-4xl mx-auto">
						{platforms.map((platform) => (
							<RevealOnScroll key={platform.name} variant="scale">
								<button className="w-full card-sharp p-8 px-12 flex items-center gap-4 cursor-default">
									<div className="text-primary/80">{platform.icon}</div>
									<div className="text-left">
										<p className="text-lg font-bold text-text">
											{platform.name}
										</p>
										<div className="flex items-center justify-start gap-3 mt-1">
											{platform.arch.map((arch) => (
												<a
													href={arch.link}
													download
													className="text-lg text-primary cursor-pointer"
												>
													{arch.name}
												</a>
											))}
										</div>
									</div>
								</button>
							</RevealOnScroll>
						))}
					</div>
				</div>
			</section>
		</>
	);
}
