"use client";

import {
	ArrowLeft,
	Check,
	Copy,
	CreditCard,
	Loader,
	ShieldCheck,
	Upload,
	X,
} from "lucide-react";
import { CldUploadWidget } from "next-cloudinary";
import { useEffect, useState } from "react";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { Modal, useToast } from "@/packages/ui";
import type { Plan } from "./PlansSection";

interface PaymentInfo {
	id: string;
	iban: string;
	accountName: string;
	bankName: string | null;
	reference: string | null;
}

interface LicenseKeyInfo {
	status: string;
}

interface LicenseData {
	id: string;
	status: string;
	activatedAt: string;
	expiresAt: string;
	key?: LicenseKeyInfo;
}

interface CloudinaryResult {
	public_id: string;
	secure_url: string;
}

interface NewLicenseModalProps {
	open: boolean;
	onClose: () => void;
	onComplete?: () => void;
}

export function NewLicenseModal({
	open,
	onClose,
	onComplete,
}: NewLicenseModalProps) {
	const { toast } = useToast();
	const { convert } = useExchangeRate();
	const [step, setStep] = useState<1 | 2>(1);
	const [plans, setPlans] = useState<Plan[]>([]);
	const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
	const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
	const [uploadedProof, setUploadedProof] = useState<CloudinaryResult | null>(
		null,
	);
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [copiedField, setCopiedField] = useState<string | null>(null);
	const [activeLicense, setActiveLicense] = useState<LicenseData | null>(null);

	const copyToClipboard = (text: string, field: string) => {
		navigator.clipboard.writeText(text).then(() => {
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		});
	};

	const hasActiveLicense =
		activeLicense !== null &&
		activeLicense.status === "ACTIVE" &&
		activeLicense.key?.status !== "REVOKED" &&
		new Date(activeLicense.expiresAt) > new Date();

	useEffect(() => {
		if (open) {
			setStep(1);
			setSelectedPlan(null);
			setUploadedProof(null);
			setActiveLicense(null);
			setLoading(true);
			Promise.all([
				fetch("/api/plans").then(
					(r) => (r.ok ? r.json() : []) as Promise<Plan[]>,
				),
				fetch("/api/payment-info").then(
					(r) =>
						(r.ok ? r.json() : null) as Promise<PaymentInfo | null>,
				),
				fetch("/api/my-account/license").then(
					(r) =>
						(r.ok ? r.json() : null) as Promise<{
							license: LicenseData;
						} | null>,
				),
			])
				.then(([p, info, lic]) => {
					setPlans(Array.isArray(p) ? p : []);
					setPaymentInfo(info);
					if (lic?.license) setActiveLicense(lic.license);
				})
				.catch(() => {})
				.finally(() => setLoading(false));
		}
	}, [open]);

	const handleSelectPlan = (plan: Plan) => {
		setSelectedPlan(plan);
		setStep(2);
	};

	const handleSubmit = async () => {
		if (!selectedPlan || !uploadedProof) return;
		setSubmitting(true);
		try {
			const res = await fetch("/api/payments/submit", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					planId: selectedPlan.id,
					proofPublicId: uploadedProof.public_id,
					proofUrl: uploadedProof.secure_url,
				}),
			});
			if (!res.ok) {
				const data = (await res.json()) as { error?: string };
				throw new Error(data.error);
			}
			toast("Pagamento submetido com sucesso! Será validado em instantes.");
			onComplete?.();
			onClose();
		} catch (err) {
			toast(err instanceof Error ? err.message : "Erro ao submeter pagamento");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Modal open={open} onClose={onClose}>
			<div className="bg-surface backdrop-blur-sm p-8 w-full max-w-2xl space-y-4 border">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div>
							<h3 className="text-lg md:text-xl font-semibold text-text">
								{step === 1
									? hasActiveLicense
										? "Licença Ativa"
										: "Escolher Plano"
									: "Dados para Pagamento"}
							</h3>
							<p className="text-base md:text-lg text-text-muted">
								{step === 1
									? hasActiveLicense
										? "Uma licença foi encontrada"
										: "Selecione o plano desejado"
									: `Pagamento da(o) ${selectedPlan?.name}`}
							</p>
						</div>
					</div>
					<div className="flex gap-2 items-center justify-center">
						<button type="button"
							onClick={onClose}
							className="p-1.5 border text-sm font-medium text-text-muted hover:text-text hover:bg-surface-hover transition-all"
						>
							<X />
						</button>
					</div>
				</div>

				<div className="py-2">
					{loading ? (
						<div className="py-12 px-24 flex flex-col items-center gap-3">
							<Loader size={24} className="text-primary animate-spin" />
							<p className="text-base text-text">A carregar planos...</p>
						</div>
					) : step === 1 ? (
						hasActiveLicense ? (
							<div className="text-center py-10 text-text-muted space-y-3">
								<ShieldCheck size={48} className="mx-auto text-success" />
								<p className="text-base md:text-lg font-medium text-text">
									Já possui uma licença ativa
								</p>
								<p className="text-base">
									Válida até{" "}
									{new Date(activeLicense?.expiresAt).toLocaleDateString(
										"pt-PT",
									)}
								</p>
							</div>
						) : (
							<div className="space-y-3">
								{plans.length === 0 ? (
									<div className="text-center py-10 text-text-muted">
										<CreditCard size={40} className="mx-auto mb-3 opacity-50" />
										<p className="text-base md:text-lg">
											Nenhum plano disponível de momento
										</p>
									</div>
								) : (
									plans.map((plan) => (
										<div
											key={plan.id}
											className="w-full space-y-6 text-left group flex items-center flex-col justify-between"
										>
											<div className="flex-1 min-w-0">
												<div className="flex items-center justify-between">
													<h4 className="text-xl font-semibold text-text">
														Aquisição de(a) {plan.name}
													</h4>
													<span className="text-xl font-bold text-text">
														{convert(plan.basePrice)} Kz
													</span>
												</div>
												{plan.description && (
													<p className="max-w-md text-base text-text-muted mt-0.5 text-wrap">
														{plan.description} (
														<span className="text-primary font-bold">
															Duração de {plan.durationDays} dias
														</span>
														).
													</p>
												)}
											</div>
											<button type="button"
												onClick={() => handleSelectPlan(plan)}
												className="bg-primary w-full py-2 text-base md:text-lg font-semibold"
											>
												Comprar
											</button>
										</div>
									))
								)}
							</div>
						)
					) : (
						<div className="space-y-5">
							{paymentInfo ? (
								<div className="divide-y divide-gray-600">
									<span className="text-base md:text-lg font-semibold text-text mb-1">
										Transferência Bancária
									</span>
									<div className="mt-1 space-y-3">
										<div className="flex items-center gap-2 mb-1"></div>
										<div className="space-y-1">
											<div className="flex items-center justify-between gap-8">
												<span className="text-base md:text-lg text-text font-bold">
													IBAN
												</span>
												<div className="flex items-center gap-2">
													<span className="text-base md:text-lg text-text">
														{paymentInfo.iban}
													</span>
													<button
														type="button"
														onClick={() =>
															copyToClipboard(paymentInfo.iban, "iban")
														}
														className="cursor-pointer text-text font-bold hover:text-primary transition-colors"
														title="Copiar IBAN"
													>
														{copiedField === "iban" ? (
															<Check size={16} className="text-success" />
														) : (
															<Copy size={16} />
														)}
													</button>
												</div>
											</div>
											<div className="flex items-center justify-between">
												<span className="text-base md:text-lg text-text font-bold">
													Titular
												</span>
												<span className="text-base md:text-lg font-medium text-text">
													{paymentInfo.accountName}
												</span>
											</div>
											{paymentInfo.bankName && (
												<div className="flex items-center justify-between">
													<span className="text-base md:text-lg text-text font-bold">
														Banco
													</span>
													<span className="text-base md:text-lg font-medium text-text">
														{paymentInfo.bankName}
													</span>
												</div>
											)}
											{paymentInfo.reference && (
												<div className="flex items-center justify-between">
													<span className="text-base md:text-lg text-text font-bold">
														Referência
													</span>
													<div className="flex items-center gap-2">
														<span className="text-base md:text-lg font-mono font-medium text-text">
															{paymentInfo.reference}
														</span>
														<button
															type="button"
														onClick={() =>
															copyToClipboard(paymentInfo.reference ?? "", "reference")
														}
															className="cursor-pointer text-text-muted hover:text-primary transition-colors"
															title="Copiar Referência"
														>
															{copiedField === "reference" ? (
																<Check size={16} className="text-success" />
															) : (
																<Copy size={16} />
															)}
														</button>
													</div>
												</div>
											)}
											<div className="flex items-center justify-between pt-2 border-t border-border">
												<span className="text-base text-text text-base md:text-lg">
													Montante
												</span>
												<span className="text-base md:text-lg font-bold ">
													{convert(selectedPlan?.basePrice || 0)} Kz
												</span>
											</div>
										</div>
									</div>
								</div>
							) : (
								<div className="text-center py-4 text-text-muted text-base">
									Dados bancários não configurados
								</div>
							)}

							<div>
								<span className="text-base md:text-lg font-semibold text-text mb-2 block">
									Comprovativo de Pagamento
								</span>
								{uploadedProof ? (
									<div className="flex items-center gap-3 bg-success/10 border border-success/30 p-3">
										<Check size={18} className="text-success shrink-0" />
										<div className="flex-1 min-w-0">
											<p className="text-base font-medium text-success">
												Comprovativo carregado
											</p>
											<a
												href={uploadedProof.secure_url}
												target="_blank"
												rel="noopener noreferrer"
												className="text-base text-primary hover:underline truncate block"
											>
												Ver comprovativo
											</a>
										</div>
										<button type="button"
											onClick={() => setUploadedProof(null)}
											className="text-base text-text-muted hover:text-error transition-colors"
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
											clientAllowedFormats: [
												"png",
												"jpeg",
												"jpg",
												"webp",
												"pdf",
											],
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
												className="w-full border-2 border-dashed border-border p-6 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
											>
												<Upload size={22} className="text-text-muted" />
												<span className="text-base text-text-muted">
													Clique para carregar comprovativo
												</span>
												<span className="text-base text-text-muted">
													JPG, PNG ou WebP — máx. 5MB
												</span>
											</button>
										)}
									</CldUploadWidget>
								)}
							</div>

							<div className="flex items-center gap-2 w-full justify-between">
								<button type="button"
									onClick={() => setStep(1)}
									className="p-3 px-3.5 border"
								>
									<ArrowLeft size={18} />
								</button>

								<button type="button"
									onClick={handleSubmit}
									disabled={!uploadedProof || submitting}
									className="w-full bg-primary text-white text-base font-bold py-2.5 cursor-pointer hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
								>
									{submitting ? (
										<Loader size={16} className="animate-spin" />
									) : (
										"Submeter Pagamento"
									)}
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</Modal>
	);
}
