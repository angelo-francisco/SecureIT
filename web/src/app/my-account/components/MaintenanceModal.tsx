"use client";

import { ArrowLeft, Check, Loader, Shield, Upload, X } from "lucide-react";
import { CldUploadWidget } from "next-cloudinary";
import { useEffect, useState } from "react";
import { Modal, useToast } from "@/packages/ui";

interface LicenseData {
	id: string;
	activatedAt: string;
	expiresAt: string;
	status: string;
	key: {
		key: string;
		type: string;
		durationDays: number;
	};
}

interface CloudinaryResult {
	public_id: string;
	secure_url: string;
}

interface MaintenanceModalProps {
	open: boolean;
	onClose: () => void;
}

export function MaintenanceModal({ open, onClose }: MaintenanceModalProps) {
	const { toast } = useToast();
	const [step, setStep] = useState<1 | 2 | 3>(1);
	const [license, setLicense] = useState<LicenseData | null>(null);
	const [loadingLicense, setLoadingLicense] = useState(false);
	const [description, setDescription] = useState("");
	const [uploadedProof, setUploadedProof] = useState<CloudinaryResult | null>(
		null,
	);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (!open) return;
		setLoadingLicense(true);
		fetch("/api/my-account/license")
			.then((res) => {
				if (!res.ok) {
					throw new Error("Erro durante o processamento");
				}
				return res.json();
			})
			.then((data) => {
				const l = (data as { license?: LicenseData } | null)?.license ?? null;
				if (l && l.status === "ACTIVE" && new Date(l.expiresAt) > new Date()) {
					setLicense(l);
				}
			})
			.catch(() => {})
			.finally(() => {
				setLoadingLicense(false);
			});
	}, [open]);

	const reset = () => {
		setStep(1);
		setLicense(null);
		setDescription("");
		setUploadedProof(null);
		setSubmitting(false);
	};

	const handleClose = () => {
		reset();
		onClose();
	};

	const handleSubmit = async () => {
		if (!license || !description) return;
		setSubmitting(true);
		try {
			const res = await fetch("/api/maintenance/request", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					licenseId: license.id,
					description,
					proofPublicId: uploadedProof?.public_id,
					proofUrl: uploadedProof?.secure_url,
				}),
			});
			if (!res.ok) {
				const data = (await res.json()) as { error?: string };
				throw new Error(data.error);
			}
			toast("Pedido de manutenção submetido com sucesso!");
			reset();
			onClose();
		} catch (err) {
			toast(err instanceof Error ? err.message : "Erro ao submeter pedido");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Modal
			open={open}
			onClose={handleClose}
			disableBackdropClose
			className="w-full max-w-lg mx-4"
		>
			<div className="bg-surface border border-border p-6 max-h-[85vh] overflow-y-auto">
				<div className="flex items-center gap-2.5 mb-5">
					<h2 className="text-xl md:text-2xl font-display font-bold text-text">
						Solicitar Manutenção
					</h2>
				</div>

				{step === 1 && (
					<div className="space-y-4">
						{loadingLicense ? (
							<div className="flex items-center justify-center py-10">
								<Loader size={24} className="animate-spin text-primary" />
							</div>
						) : !license ? (
							<div className="text-center py-8 space-y-3">
								<Shield size={40} className="text-text-muted mx-auto" />
								<p className="text-lg md:text-xl font-semibold text-text">
									Nenhuma licença ativa encontrada
								</p>
								<p className="text-base md:text-lg text-text-muted">
									Para solicitar manutenção, precisa de ter uma licença ativa.
									Subscreva um plano para começar.
								</p>
							</div>
						) : (
							<>
								<p className="text-base text-text-muted">
									Selecione a licença para a qual pretende solicitar manutenção:
								</p>
								<div className="border border-primary/30 bg-primary/5 rounded-lg p-4 space-y-2">
									<div className="flex items-center gap-2">
										<Shield size={18} className="text-primary" />
										<span className="font-semibold text-text">
											Licença {license.key.type}
										</span>
									</div>
									<div className="text-base text-text-muted space-y-1 ml-7">
										<p>
											Chave: <span className="text-sm">{license.key.key}</span>
										</p>
										<p>
											Expira:{" "}
											<span className="text-text">
												{new Date(license.expiresAt).toLocaleDateString(
													"pt-AO",
												)}
											</span>
										</p>
										<div className="flex items-center gap-1.5">
											<Check size={14} className="text-success" />
											<span className="text-success text-sm font-medium">
												Activa
											</span>
										</div>
									</div>
								</div>
							</>
						)}

						<div className="flex justify-center items-center gap-3 pt-2">
							<button
								type="button"
								onClick={handleClose}
								className="px-4 py-2.5 border text-base font-medium text-text-muted hover:text-text hover:bg-surface-hover transition-all"
							>
								<X />
							</button>
							<button
								type="button"
								onClick={() => license && setStep(2)}
								disabled={!license}
								className="w-full text-center bg-primary text-white px-6 py-2.5 text-lg font-bold hover:brightness-110 transition-all disabled:opacity-50"
							>
								Continuar
							</button>
						</div>
					</div>
				)}

				{step === 2 && (
					<div className="space-y-2">
						<h3 className="text-lg font-semibold text-text">
							Descrever Problema
						</h3>
						<div>
							<textarea
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Descreva o problema que está a enfrentar..."
								rows={5}
								className="w-full px-3 py-2 bg-bg border border-border text-base md:text-lg text-text focus:outline-none focus:border-primary resize-none"
							/>
						</div>
						<div className="flex justify-between items-center gap-3 pt-4">
							<button
								type="button"
								onClick={() => setStep(1)}
								className="px-4 py-2.5 border text-base font-medium text-text-muted hover:text-text hover:bg-surface-hover transition-all"
							>
								<ArrowLeft />
							</button>
							<button
								type="button"
								onClick={() => description && setStep(3)}
								disabled={!description}
								className="w-full text-center bg-primary text-white px-6 py-2.5 text-lg font-bold hover:brightness-110 transition-all disabled:opacity-50"
							>
								Continuar
							</button>
						</div>
					</div>
				)}

				{step === 3 && (
					<div className="space-y-5">
						<h3 className="text-lg font-semibold text-text flex items-center gap-2">
							<Check size={20} className="text-primary" />
							Comprovativo de Pagamento
						</h3>

						<div>
							<span className="text-base font-medium text-text mb-2 block">
								Comprovativo (opcional)
							</span>
							{uploadedProof ? (
								<div className="flex items-center gap-3 bg-success/10 border border-success/30 rounded-lg p-3">
									<Check size={18} className="text-success shrink-0" />
									<div className="flex-1 min-w-0">
										<p className="text-base font-medium text-success">
											Comprovativo carregado
										</p>
										<a
											href={uploadedProof.secure_url}
											target="_blank"
											rel="noopener noreferrer"
											className="text-sm text-primary hover:underline truncate block"
										>
											Ver comprovativo
										</a>
									</div>
									<button
										type="button"
										onClick={() => setUploadedProof(null)}
										className="text-sm text-text-muted hover:text-error transition-colors"
									>
										Remover
									</button>
								</div>
							) : (
								<CldUploadWidget
									signatureEndpoint="/api/sign-cloudinary-params"
									uploadPreset="secureit-payments"
									options={{
										maxFiles: 1,
										resourceType: "auto",
										clientAllowedFormats: ["png", "jpeg", "jpg", "webp", "pdf"],
										maxFileSize: 2000000,
										multiple: false,
										folder: "secureit/payments",
										sources: ["local", "url", "camera"],
									}}
									onError={() => {
										toast("Erro ao carregar comprovativo");
									}}
									onQueuesStart={(_result, { widget }) => {
										widget.minimize();
									}}
									onSuccess={(result) => {
										const info = result.info as CloudinaryResult;
										setUploadedProof({
											public_id: info.public_id,
											secure_url: info.secure_url,
										});
									}}
								>
									{({ open }) => (
										<button
											onClick={() => open()}
											type="button"
											className="w-full border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
										>
											<Upload size={22} className="text-text-muted" />
											<span className="text-base text-text-muted">
												Clique para carregar comprovativo
											</span>
											<span className="text-sm text-text-muted">
												JPG, PNG ou WebP — máx. 5MB
											</span>
										</button>
									)}
								</CldUploadWidget>
							)}
						</div>

						<div className="flex justify-between items-center w-full gap-3">
							<button
								type="button"
								onClick={() => setStep(2)}
								className="px-4 py-2.5 border text-base font-medium text-text-muted hover:text-text hover:bg-surface-hover transition-all"
							>
								<ArrowLeft />
							</button>

							<button
								type="button"
								onClick={handleSubmit}
								disabled={submitting}
								className="w-full text-center bg-primary text-white px-6 py-2.5 text-base font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
							>
								{submitting ? (
									<Loader size={14} className="animate-spin" />
								) : (
									"Submeter Pedido"
								)}
							</button>
						</div>
					</div>
				)}
			</div>
		</Modal>
	);
}
