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

interface AddonRowProps {
	name: string;
	description: string | null;
	price: number;
	selected: boolean;
	onToggle: () => void;
	convert: (usd: number) => string;
}

function AddonRow({
	name,
	description,
	price,
	selected,
	onToggle,
	convert,
}: AddonRowProps) {
	return (
		<button
			type="button"
			onClick={onToggle}
			className={`w-full flex items-start gap-3 p-3 border text-left transition-all ${selected
					? "border-primary/50 bg-primary/10"
					: "border-border bg-surface hover:border-primary/30 hover:bg-surface-hover"
				}`}
		>
			<span
				className={`mt-0.5 shrink-0 w-5 h-5 border flex items-center justify-center ${selected
						? "bg-primary border-primary text-white"
						: "border-border text-transparent"
					}`}
			>
				<Check size={14} strokeWidth={3} />
			</span>
			<span className="flex-1 min-w-0">
				<span className="flex items-center justify-between gap-3">
					<span className="text-base font-medium text-text">{name}</span>
					<span className="text-base font-bold text-text shrink-0">
						{price > 0 ? `${convert(price)} Kz` : "Grátis"}
					</span>
				</span>
				{description && (
					<span className="block text-sm text-text-muted mt-0.5">
						{description}
					</span>
				)}
			</span>
		</button>
	);
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
	const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>([]);
	const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

	const plan = selectedPlan;
	const addons = [
		...(plan?.features ?? []).filter((f) => selectedFeatureIds.includes(f.id)),
		...(plan?.services ?? []).filter((s) => selectedServiceIds.includes(s.id)),
	];
	const addonsTotal = addons.reduce((sum, a) => sum + (a.price || 0), 0);
	const totalPrice = (plan?.basePrice ?? 0) + addonsTotal;

	const copyToClipboard = (text: string, field: string) => {
		navigator.clipboard.writeText(text).then(() => {
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		});
	};

	useEffect(() => {
		if (open) {
			setStep(1);
			setSelectedPlan(null);
			setUploadedProof(null);
			setActiveLicense(null);
			setSelectedFeatureIds([]);
			setSelectedServiceIds([]);
			setLoading(true);
			Promise.all([
				fetch("/api/plans").then(
					(r) => (r.ok ? r.json() : []) as Promise<Plan[]>,
				),
				fetch("/api/payment-info").then(
					(r) => (r.ok ? r.json() : null) as Promise<PaymentInfo | null>,
				),
				fetch("/api/my-account/license").then(
					(r) =>
						(r.ok ? r.json() : null) as Promise<LicenseData| null>,
				),
			])
				.then(([p, info, lic]) => {
					setPlans(Array.isArray(p) ? p : []);
					setPaymentInfo(info);
					if (lic) setActiveLicense(lic);
				})
				.catch(() => { })
				.finally(() => setLoading(false));
		}
	}, [open]);

	const handleSelectPlan = (plan: Plan) => {
		setSelectedPlan(plan);
		setSelectedFeatureIds([]);
		setSelectedServiceIds([]);
		setStep(2);
	};

	const toggleFeature = (id: string) => {
		setSelectedFeatureIds((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
		);
	};

	const toggleService = (id: string) => {
		setSelectedServiceIds((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
		);
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
					selectedFeatures: selectedFeatureIds,
					selectedServices: selectedServiceIds,
					totalPrice,
					durationDays: selectedPlan.durationDays,
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

	const hasActiveLicense =
		activeLicense !== null &&
		activeLicense.status === "ACTIVE" &&
		activeLicense.key?.status === "ACTIVE" &&
		new Date(activeLicense.expiresAt) > new Date();

	return (
		<Modal open={open} onClose={onClose}>
			<div className="bg-surface backdrop-blur-sm p-8 w-full max-w-3xl space-y-4 border max-h-[90vh] overflow-y-auto">
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
						<button
							type="button"
							onClick={onClose}
							className="p-1.5 border text-base font-medium text-text-muted hover:text-text hover:bg-surface-hover transition-all"
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
							<div className="text-center py-10 px-24 text-text-muted space-y-3">
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
											<button
												type="button"
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
							{plan &&
								(plan.features?.length > 0 || plan.services?.length > 0) && (
									<div className="space-y-4">
										<div>
											<span className="text-base md:text-lg font-semibold text-text block mb-1">
												Funcionalidades adicionais
											</span>
										</div>

										{plan.features?.length > 0 && (
											<div className="space-y-2">
												{plan.features.map((f) => (
													<AddonRow
														key={f.id}
														name={f.name}
														description={f.description}
														price={f.price}
														selected={selectedFeatureIds.includes(f.id)}
														onToggle={() => toggleFeature(f.id)}
														convert={convert}
													/>
												))}
											</div>
										)}

										{plan.services?.length > 0 && (
											<div className="space-y-2">
												<span className="text-base font-semibold text-text-muted block">
													Serviços
												</span>
												{plan.services.map((s) => (
													<AddonRow
														key={s.id}
														name={s.name}
														description={s.description}
														price={s.price}
														selected={selectedServiceIds.includes(s.id)}
														onToggle={() => toggleService(s.id)}
														convert={convert}
													/>
												))}
											</div>
										)}
									</div>
								)}

							{paymentInfo ? (
								<div className="divide-y divide-gray-600">
									<span className="text-base md:text-lg font-semibold text-text mb-1">
										Transferência Bancária
									</span>
									<div className="mt-1 space-y-3">
										<div className="flex items-center gap-2 mb-1"></div>
										<div className="space-y-1">
											<div className="flex items-center justify-between gap-12">
												<span className="text-base md:text-lg text-text font-bold">
													IBAN
												</span>
												<div className="flex items-center gap-2">
													<span className="text-base md:text-lg text-text truncate">
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
														<span className="text-base md:text-lg font-medium text-text">
															{paymentInfo.reference}
														</span>
														<button
															type="button"
															onClick={() =>
																copyToClipboard(
																	paymentInfo.reference ?? "",
																	"reference",
																)
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
											<div className="space-y-1 pt-2 border-t border-border">
												<div className="flex items-center justify-between">
													<span className="text-base md:text-lg text-text">
														{selectedPlan?.name}
													</span>
													<span className="text-base md:text-lg font-medium text-text">
														{convert(selectedPlan?.basePrice || 0)} Kz
													</span>
												</div>
												{addons.map((a) => (
													<div
														key={a.id}
														className="flex items-center justify-between"
													>
														<span className="text-base text-text">
															{a.name}
														</span>
														<span className="text-base font-medium text-text">
															{convert(a.price || 0)} Kz
														</span>
													</div>
												))}
												<div className="flex items-center justify-between pt-1">
													<span className="text-base md:text-lg text-text">
														Montante Total
													</span>
													<span className="text-base md:text-lg font-bold text-text">
														{convert(totalPrice)} Kz
													</span>
												</div>
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
										<button
											type="button"
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
								<button
									type="button"
									onClick={() => setStep(1)}
									className="p-3 px-3.5 border"
								>
									<ArrowLeft size={18} />
								</button>

								<button
									type="button"
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
