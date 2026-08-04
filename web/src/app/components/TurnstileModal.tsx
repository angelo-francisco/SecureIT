"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { Loader, X } from "lucide-react";
import { useEffect, useState } from "react";

interface TurnstileModalProps {
	open: boolean;
	onClose: () => void;
	downloadUrl: string;
}

export function TurnstileModal({
	open,
	onClose,
	downloadUrl,
}: TurnstileModalProps) {
	const [status, setStatus] = useState<"idle" | "verifying" | "done">("idle");

	useEffect(() => {
		if (!open) {
			setStatus("idle");
		}
	}, [open]);

	const handleSuccess = async (token: string) => {
		setStatus("verifying");
		try {
			const res = await fetch("/api/verify-turnstile", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token }),
			});
			const data = (await res.json()) as { success: boolean };
			if (data.success) {
				setStatus("done");
				window.open(downloadUrl, "_blank", "noopener,noreferrer");
				setTimeout(() => onClose(), 800);
			} else {
				setStatus("idle");
			}
		} catch {
			setStatus("idle");
		}
	};

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
			<button
				type="button"
				aria-label="Fechar"
				onClick={onClose}
				className="absolute inset-0"
			/>
			<div className="relative w-full max-w-md mx-4 bg-surface border border-border p-8 text-center">
				<button type="button"
					onClick={onClose}
					className="absolute top-4 right-4 text-text-muted hover:text-text transition-colors"
				>
					<X size={20} />
				</button>

				<h3 className="text-xl font-bold text-text mb-2">
					Verificação de Segurança
				</h3>
				<p className="text-sm text-text-muted mb-6">
					Complete o desafio abaixo para iniciar o download
				</p>

				{status === "done" ? (
					<div className="py-8">
						<p className="text-success font-semibold">
							Verificação concluída! Download a iniciar...
						</p>
					</div>
				) : (
					<div className="flex justify-center">
						{status === "verifying" ? (
							<div className="py-8 flex flex-col items-center gap-3">
								<Loader size={24} className="animate-spin text-primary" />
								<p className="text-sm text-text-muted">A verificar...</p>
							</div>
						) : (
							<Turnstile
								siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
								onSuccess={handleSuccess}
								options={{
									theme: "dark",
								}}
							/>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
