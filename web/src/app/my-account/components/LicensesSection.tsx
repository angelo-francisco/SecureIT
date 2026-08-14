"use client";

import { Check, Copy, Eye, EyeOff, Key, X } from "lucide-react";
import { forwardRef, useImperativeHandle, useState } from "react";
import { Modal, useToast } from "@/packages/ui";

interface LicenseData {
	id: string;
	status: string;
	activatedAt: string;
	expiresAt: string;
	machineHash: string | null;
	key: {
		key: string;
		type: string;
		status: string;
		durationDays: number;
	};
}

interface LicensesSectionProps {
	data: LicenseData | null;
	onNavigateToPlans?: () => void;
}

export interface LicensesSectionHandle {
	fetchData: () => Promise<LicenseData | null>;
}

const LICENSE_STATUS: Record<
	string,
	{ label: string; color: string; bg: string }
> = {
	ACTIVE: {
		label: "Activa",
		color: "text-success",
		bg: "bg-success/10",
	},
	APPROVED: {
		label: "Aprovada",
		color: "text-primary",
		bg: "bg-primary/10",
	},
	REVOKED: {
		label: "Revogada",
		color: "text-error",
		bg: "bg-error/10",
	},
	EXPIRED: {
		label: "Expirada",
		color: "text-text-muted",
		bg: "bg-surface",
	},
	PENDING: {
		label: "Pendente",
		color: "text-warning",
		bg: "bg-warning/10",
	},
};

export const LicensesSection = forwardRef<
	LicensesSectionHandle,
	LicensesSectionProps
>(({ data }, ref) => {
	const { toast } = useToast();
	const [response, setResponse] = useState<LicenseData | null>(data);
	const [revoking, setRevoking] = useState(false);
	const [confirmRevoke, setConfirmRevoke] = useState(false);
	const [showKey, setShowKey] = useState(false);
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(license?.key.key ?? "");
			setCopied(true);
			toast("Chave copiada para o clipboard");
			setTimeout(() => setCopied(false), 2000);
		} catch {}
	};

	useImperativeHandle(ref, () => ({
		fetchData: async () => {
			const res = await fetch("/api/my-account/license");
			if (res.ok) {
				const d = (await res.json()) as LicenseData;
				setResponse(d);
				return d;
			}
			return null;
		},
	}));

	const license = response;
	const isActive = license
		? license.status === "ACTIVE" &&
			license.key.status === "ACTIVE" &&
			new Date(license.expiresAt) > new Date()
		: false;

	const statusInfo = license
		? isActive
			? LICENSE_STATUS.ACTIVE
			: license.status === "REVOKED" || license.key.status === "REVOKED"
				? LICENSE_STATUS.REVOKED
				: new Date(license.expiresAt) <= new Date()
					? LICENSE_STATUS.EXPIRED
					: LICENSE_STATUS.PENDING
		: null;

	const handleRevoke = async () => {
		setRevoking(true);
		try {
			const res = await fetch("/api/licenses/revoke", { method: "POST" });
			if (!res.ok) {
				const data = (await res.json()) as { error?: string };
				throw new Error(data.error ?? "Erro ao revogar licença");
			}

			const refreshRes = await fetch("/api/my-account/license");
			if (refreshRes.ok) {
				const d = (await refreshRes.json()) as LicenseData;
				setResponse(d);
			} else {
				setResponse((prev) =>
					prev
						? {
								...prev,
								status: "REVOKED",
								key: { ...prev.key, status: "REVOKED" },
							}
						: null,
				);
			}
			setConfirmRevoke(false);
			toast("Licença revogada com sucesso", "success");
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Erro ao revogar licença";
			toast(message, "error");
			console.error(err);
		} finally {
			setRevoking(false);
		}
	};

	if (!license) {
		return (
			<div className="text-center py-8 text-text-muted">
				<Key size={36} className="text-primary mx-auto mb-3 opacity-40" />
				<p className="text-base font-medium">Nenhuma licença activa</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<span className="text-lg md:text-xl font-semibold text-text font-display">
					{license.key.type}
				</span>
				<div className="flex gap-2 items-center">
					{isActive && (
						<button
							type="button"
							onClick={() => setConfirmRevoke(true)}
							className="px-3 py-1 text-base font-semibold bg-error text-white border border-error/30 transition-all cursor-pointer"
						>
							Revogar
						</button>
					)}
				</div>
			</div>

			<div className="space-y-2 text-base">
				<DetailRow
					label="Estado"
					value={
						<span
							className={`uppercase font-bold ${statusInfo?.color} ${statusInfo?.bg}`}
						>
							{statusInfo?.label}
						</span>
					}
				/>
				<DetailRow
					label="Chave"
					value={
						<span className="flex items-center justify-end gap-1.5">
							<span className="text-base font-medium text-text break-all">
								{showKey ? license.key.key : "***********"}
							</span>
							<button
								type="button"
								onClick={() => setShowKey(!showKey)}
								className="p-1 text-text-muted hover:text-text transition-colors cursor-pointer"
								aria-label={showKey ? "Ocultar chave" : "Ver chave"}
							>
								{showKey ? <EyeOff size={18} /> : <Eye size={18} />}
							</button>
							<button
								type="button"
								onClick={handleCopy}
								className="p-1 text-text-muted hover:text-text transition-colors cursor-pointer"
								aria-label="Copiar chave"
							>
								{copied ? <Check size={18} /> : <Copy size={18} />}
							</button>
						</span>
					}
				/>
				<DetailRow
					label="Activada em"
					value={
						<span className="text-base">
							{new Date(license.activatedAt).toLocaleDateString("pt-PT")}
						</span>
					}
				/>
				<DetailRow
					label="Expira em"
					value={
						<span className="text-base">
							{new Date(license.expiresAt).toLocaleDateString("pt-PT")}
						</span>
					}
				/>
				<DetailRow
					label="Dias restantes"
					value={
						<span className="text-base">
							{String(
								Math.max(
									0,
									Math.ceil(
										(new Date(license.expiresAt).getTime() - Date.now()) /
											(1000 * 60 * 60 * 24),
									),
								),
							)}{" "}
							dias
						</span>
					}
				/>
				{license.machineHash && (
					<DetailRow
						label="Máquina"
						value={
							<span className="text-base text-text-muted break-all">
								{license.machineHash}
							</span>
						}
					/>
				)}
			</div>

			<Modal
				open={confirmRevoke}
				onClose={() => setConfirmRevoke(false)}
				className="w-full max-w-sm mx-4"
			>
				<div className="bg-surface border border-border p-6 shadow-2xl">
					<div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
						<h3 className="text-base font-bold text-text font-display">
							Revogar Licença
						</h3>
						<button
							type="button"
							onClick={() => setConfirmRevoke(false)}
							className="p-1 border border-border text-text-muted hover:text-text hover:bg-surface-hover transition-all"
						>
							<X size={16} />
						</button>
					</div>
					<p className="text-sm text-text-muted mb-6 leading-relaxed">
						Tem certeza que deseja revogar a licença? Esta acção não pode ser
						desfeita. Precisará de uma nova chave para reactivar.
					</p>
					<div className="flex gap-3">
						<button
							type="button"
							onClick={() => setConfirmRevoke(false)}
							className="flex-1 py-2 text-sm font-semibold text-text-muted border border-border hover:bg-surface-hover transition-all"
						>
							Cancelar
						</button>
						<button
							type="button"
							onClick={handleRevoke}
							disabled={revoking}
							className="flex-1 py-2 text-sm font-semibold text-white bg-error border border-error hover:bg-error/80 transition-all disabled:opacity-50"
						>
							{revoking ? "A revogar..." : "Revogar"}
						</button>
					</div>
				</div>
			</Modal>
		</div>
	);
});

LicensesSection.displayName = "LicensesSection";

function DetailRow({
	label,
	value,
}: {
	label: string;
	value: React.ReactNode;
}) {
	return (
		<div className="flex justify-between items-center py-1 border-b border-border/40 last:border-b-0">
			<span className="text-base">{label}</span>
			<div className="text-base text-right">{value}</div>
		</div>
	);
}
