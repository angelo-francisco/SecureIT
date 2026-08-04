"use client";

import {
	ArrowLeft,
	Check,
	Copy,
	CreditCard,
	Loader,
	Mail,
	MessageCircle,
	Phone,
	Upload,
} from "lucide-react";
import { CldUploadWidget } from "next-cloudinary";
import { forwardRef, useCallback, useImperativeHandle, useState } from "react";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { useToast } from "@/packages/ui";

export interface PlanFeature {
	id: string;
	name: string;
	description: string | null;
	price: number;
}

export interface PlanService {
	id: string;
	name: string;
	description: string | null;
	price: number;
}

export interface Plan {
	id: string;
	name: string;
	description: string | null;
	basePrice: number;
	currency: string;
	durationDays: number;
	features: PlanFeature[];
	services: PlanService[];
}

interface PaymentInfo {
	id: string;
	iban: string;
	accountName: string;
	bankName: string | null;
	reference: string | null;
}

interface CloudinaryResult {
	public_id: string;
	secure_url: string;
}

interface PlansSectionProps {
	data: { plans: Plan[]; paymentInfo: PaymentInfo | null };
	onClose?: () => void;
}

export interface PlansSectionHandle {
	fetchData: () => Promise<{ plans: Plan[]; paymentInfo: PaymentInfo | null }>;
}

const INCLUDED_FEATURES = [
	"Câmeras ilimitadas",
	"Pessoas ilimitadas",
	"Deteção de pessoas (YOLOv11)",
	"Reconhecimento facial",
	"Alertas em tempo real",
];

export const PlansSection = forwardRef<PlansSectionHandle, PlansSectionProps>(
	({ data: initialData, onClose }, ref) => {
		const { toast } = useToast();
		const { convert } = useExchangeRate();
		const [_plans, setPlans] = useState<Plan[]>(initialData.plans);
		const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(
			initialData.paymentInfo,
		);
		const [selectedPlan, setSelectedPlan] = useState<Plan | null>(
			initialData.plans[0] ?? null,
		);
		const [annual, setAnnual] = useState(false);
		const [uploadedProof, setUploadedProof] = useState<CloudinaryResult | null>(
			null,
		);
		const [submitting, setSubmitting] = useState(false);
		const [copiedField, setCopiedField] = useState<string | null>(null);

		const monthlyPrice = selectedPlan?.basePrice ?? 0;
		const annualPrice = monthlyPrice * 12;
		const displayPrice = annual ? annualPrice : monthlyPrice;

		const copyToClipboard = useCallback((text: string, field: string) => {
			navigator.clipboard.writeText(text).then(() => {
				setCopiedField(field);
				setTimeout(() => setCopiedField(null), 2000);
			});
		}, []);

		useImperativeHandle(ref, () => ({
			fetchData: async () => {
				const [plansRes, infoRes] = await Promise.all([
					fetch("/api/plans"),
					fetch("/api/payment-info"),
				]);
				const p = (plansRes.ok ? await plansRes.json() : []) as Plan[];
				const info = (
					infoRes.ok ? await infoRes.json() : null
				) as PaymentInfo | null;
				setPlans(p);
				setPaymentInfo(info);
				if (p.length > 0) setSelectedPlan(p[0]);
				return { plans: p, paymentInfo: info };
			},
		}));

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
						totalPrice: displayPrice,
						durationDays: annual ? 365 : 30,
					}),
				});
				if (!res.ok) {
					const data = (await res.json()) as { error?: string };
					throw new Error(data.error);
				}
				toast(
					"Pagamento submetido com sucesso! Aguarde a validação em alguns instantes.",
				);
				setUploadedProof(null);
				onClose?.();
			} catch (err) {
				toast(
					err instanceof Error ? err.message : "Erro ao submeter pagamento",
				);
			} finally {
				setSubmitting(false);
			}
		};

		if (!selectedPlan) {
			return (
				<div className="text-center py-10 text-text-muted">
					<CreditCard size={40} className="mx-auto mb-3 opacity-50" />
					<p>Nenhum plano disponível de momento</p>
				</div>
			);
		}

		return (
			<div className="space-y-6">
				<div className="card-sharp border-primary/25 bg-primary/5 p-5">
					<h3 className="text-2xl text-center font-bold text-text">
						{selectedPlan.name}
					</h3>
					<p className="text-text-muted text-center mb-3">
						{selectedPlan.description}
					</p>

					<div className="flex justify-center items-baseline gap-1">
						<span className="text-3xl font-bold text-text">
							{convert(displayPrice)} Kz
						</span>
						<span className="text-sm text-text-muted">
							{annual ? "/ano" : "/ mês"}
						</span>
					</div>

					<div className="mt-4 flex items-center justify-center gap-3">
						<span
							className={`text-xs font-medium ${!annual ? "text-text" : "text-text-muted"}`}
						>
							Mensal
						</span>
						<button
							type="button"
							onClick={() => setAnnual(!annual)}
							className={`relative w-10 h-5 transition-colors ${annual ? "bg-primary" : "bg-border"}`}
						>
							<div
								className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white shadow transition-transform ${annual ? "translate-x-5" : "translate-x-0"}`}
							/>
						</button>
						<span
							className={`text-xs font-medium ${annual ? "text-text" : "text-text-muted"}`}
						>
							Anual
						</span>
					</div>

					<div className="mt-4 space-y-1">
						{INCLUDED_FEATURES.map((f) => (
							<div
								key={f}
								className="flex items-center gap-1.5 text-base text-text-muted"
							>
								<Check size={14} className="text-primary shrink-0" />
								{f}
							</div>
						))}
					</div>
				</div>

				<div>
					<span className="text-base md:text-xl mb-2 text-text block">
						Dados para Pagamento
					</span>
					{paymentInfo ? (
						<div className="border bg-surface p-4 space-y-2">
							<div className="flex items-center justify-between">
								<span className="text-sm text-gray-200 font-bold">IBAN</span>
								<div className="flex items-center gap-2">
									<span className="text-base text-text">
										{paymentInfo.iban}
									</span>
									<button
										type="button"
										onClick={() => copyToClipboard(paymentInfo.iban, "iban")}
										className="text-base cursor-pointer text-text-muted hover:text-primary transition-colors"
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
								<span className="text-base text-gray-200 font-bold">
									Titular
								</span>
								<span className="text-base font-medium text-text">
									{paymentInfo.accountName}
								</span>
							</div>
							{paymentInfo.bankName && (
								<div className="flex items-center justify-between">
									<span className="text-base text-gray-200 font-bold">
										Banco
									</span>
									<span className="text-base text-text">
										{paymentInfo.bankName}
									</span>
								</div>
							)}
							{paymentInfo.reference && (
								<div className="flex items-center justify-between">
									<span className="text-base text-gray-200 font-bold">
										Referência
									</span>
									<div className="flex items-center gap-2">
										<span className="text-base text-text">
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
						</div>
					) : (
						<div className="text-center py-4 text-text-muted text-base md:text-lg">
							Dados bancários não configurados
						</div>
					)}
				</div>

				<div className="card-sharp border-primary/20 bg-primary/[0.03] p-5">
					<p className="text-lg font-semibold text-text">
						Precisa de um plano personalizado para a sua empresa?
					</p>
					<p className="text-base text-text-muted mb-4">
						Contacte a nossa equipa para uma solução à medida das suas
						necessidades.
					</p>
					<div className="flex items-center gap-3">
						<a
							href="https://wa.me/244926422462"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-2 px-4 py-2 border border-border text-xs font-medium text-text-muted hover:text-primary hover:border-primary/40 transition-all"
						>
							<MessageCircle size={16} />
							WhatsApp
						</a>
						<a
							href="tel:+244926422462"
							className="flex items-center gap-2 px-4 py-2 border border-border text-xs font-medium text-text-muted hover:text-primary hover:border-primary/40 transition-all"
						>
							<Phone size={16} />
							Telefone
						</a>
						<a
							href="mailto:newstatesofficial@gmail.com"
							className="flex items-center gap-2 px-4 py-2 border border-border text-xs font-medium text-text-muted hover:text-primary hover:border-primary/40 transition-all"
						>
							<Mail size={16} />
							Email
						</a>
					</div>
				</div>

				<div>
					<span className="text-base md:text-lg text-text mb-2 block">
						Comprovativo de Pagamento
					</span>
					{uploadedProof ? (
						<div className="flex items-center gap-3 bg-success/10 border border-success/30 p-3">
							<Check size={18} className="text-success shrink-0" />
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-success">
									Comprovativo carregado com sucesso
								</p>
								<a
									href={uploadedProof.secure_url}
									target="_blank"
									rel="noopener noreferrer"
									className="text-xs text-primary hover:underline truncate block"
								>
									Ver comprovativo
								</a>
							</div>
							<button
								type="button"
								onClick={() => setUploadedProof(null)}
								className="text-xs text-text-muted hover:text-error transition-colors"
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
									className="w-full border-2 border-dashed border-border p-6 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
								>
									<Upload size={22} className="text-text-muted" />
									<span className="text-base text-text-muted">
										Clique para carregar comprovativo
									</span>
									<span className="text-base text-text-muted">
										JPG, PNG, WebP ou PDF — máx. 2MB
									</span>
								</button>
							)}
						</CldUploadWidget>
					)}
				</div>

				<div className="bg-surface border border-border p-4">
					<div className="flex items-center justify-between">
						<span className="text-base">Plano</span>
						<span className="text-base text-text">
							{selectedPlan.name} ({annual ? "Anual" : "Mensal"})
						</span>
					</div>
					<div className="flex items-center justify-between mt-1">
						<span className="text-base">{annual ? "12 meses" : "1 mês"}</span>
						<span className="text-base text-text">
							{annual
								? `${convert(monthlyPrice * 12)} Kz`
								: `${convert(monthlyPrice)} Kz`}
						</span>
					</div>
					<div className="border-t border-border mt-2 pt-2 flex items-center justify-between">
						<span className="text-base font-semibold text-text">Total</span>
						<span className="text-lg md:text-xl font-bold text-text">
							{convert(displayPrice)} Kz
						</span>
					</div>
				</div>

				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={onClose}
						className="px-4 py-2.5 border text-sm font-medium text-text-muted hover:text-text hover:bg-surface-hover transition-all"
					>
						<ArrowLeft />
					</button>
					<button
						type="button"
						onClick={handleSubmit}
						disabled={!uploadedProof || submitting}
						className="w-full cursor-pointer bg-primary text-white text-base md:text-lg font-bold py-3 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
					>
						{submitting ? (
							<Loader size={16} className="animate-spin" />
						) : (
							"Submeter Pagamento"
						)}
					</button>
				</div>
			</div>
		);
	},
);

PlansSection.displayName = "PlansSection";
