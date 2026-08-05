"use client";

import { Key, X } from "lucide-react";
import { forwardRef, useImperativeHandle, useState } from "react";
import { Modal } from "@/packages/ui";

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

interface LicensesApiResponse {
	license: LicenseData | null;
	payments: unknown[];
}

interface LicensesSectionProps {
	data: LicensesApiResponse | null;
	onNavigateToPlans?: () => void;
}

export interface LicensesSectionHandle {
	fetchData: () => Promise<LicensesApiResponse | null>;
}

const LICENSE_STATUS: Record<
	string,
	{ label: string; color: string; bg: string }
> = {
	ACTIVE: { label: "Activa", color: "text-success border-success/30", bg: "bg-success/10" },
	APPROVED: { label: "Aprovada", color: "text-primary border-primary/30", bg: "bg-primary/10" },
	REVOKED: { label: "Revogada", color: "text-error border-error/30", bg: "bg-error/10" },
	EXPIRED: {
		label: "Expirada",
		color: "text-text-muted border-border",
		bg: "bg-surface",
	},
	PENDING: { label: "Pendente", color: "text-warning border-warning/30", bg: "bg-warning/10" },
};

export const LicensesSection = forwardRef<
	LicensesSectionHandle,
	LicensesSectionProps
>(({ data }, ref) => {
	const [response, setResponse] = useState<LicensesApiResponse | null>(data);
	const [revoking, setRevoking] = useState(false);
	const [confirmRevoke, setConfirmRevoke] = useState(false);

	useImperativeHandle(ref, () => ({
		fetchData: async () => {
			const res = await fetch("/api/my-account/license");
			if (res.ok) {
				const d = (await res.json()) as LicensesApiResponse;
				setResponse(d);
				return d;
			}
			return null;
		},
	}));

	const license = response?.license;
	const isActive = license
		? license.key.status === "ACTIVE" &&
			new Date(license.expiresAt) > new Date()
		: false;

	const statusInfo = license
		? isActive
			? LICENSE_STATUS.ACTIVE
			: license.key.status === "REVOKED"
				? LICENSE_STATUS.REVOKED
				: LICENSE_STATUS.EXPIRED
		: null;

	const handleRevoke = async () => {
		setRevoking(true);
		try {
			const res = await fetch("/api/licenses/revoke", { method: "POST" });
			if (!res.ok) {
				const data = (await res.json()) as { error?: string };
				throw new Error(data.error ?? "Erro ao revogar licença");
			}
			setResponse((prev) =>
				prev
					? {
							...prev,
							license: prev.license
								? {
										...prev.license,
										key: { ...prev.license.key, status: "REVOKED" },
									}
								: null,
						}
					: null,
			);
			setConfirmRevoke(false);
		} catch (err) {
			console.error(err);
		} finally {
			setRevoking(false);
		}
	};

	if (!license) {
		return (
			<div className="text-center py-8 text-text-muted">
				<Key size={36} className="text-primary mx-auto mb-3 opacity-40" />
				<p className="text-sm font-medium">Nenhuma licença registada</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between pb-3 border-b border-border">
				<div className="flex items-center gap-3">
					<span className="text-base font-bold text-text font-display">
						Plano {license.key.type}
					</span>
					<span
						className={`px-2.5 py-0.5 font-mono text-xs font-bold uppercase tracking-wider border ${statusInfo?.color} ${statusInfo?.bg}`}
					>
						{statusInfo?.label}
					</span>
				</div>
				<div className="flex gap-2 items-center">
					{isActive && (
						<button
							type="button"
							onClick={() => setConfirmRevoke(true)}
							className="px-3 py-1 text-xs font-semibold bg-error/10 hover:bg-error/20 text-error border border-error/30 transition-all cursor-pointer"
						>
							Revogar
						</button>
					)}
				</div>
			</div>

			<div className="space-y-2 text-sm">
				<DetailRow label="Chave" value={<code className="font-mono text-xs text-primary">{license.key.key}</code>} />
				<DetailRow
					label="Activada em"
					value={<span className="font-mono text-xs">{new Date(license.activatedAt).toLocaleDateString("pt-PT")}</span>}
				/>
				<DetailRow
					label="Expira em"
					value={<span className="font-mono text-xs">{new Date(license.expiresAt).toLocaleDateString("pt-PT")}</span>}
				/>
				<DetailRow
					label="Dias restantes"
					value={
						<span className="font-mono text-xs font-bold text-primary">
							{String(
								Math.max(
									0,
									Math.ceil(
										(new Date(license.expiresAt).getTime() - Date.now()) /
											(1000 * 60 * 60 * 24),
									),
								),
							)} dias
						</span>
					}
				/>
				{license.machineHash && (
					<DetailRow
						label="Máquina"
						value={
							<code className="font-mono text-xs text-text-muted break-all">
								{license.machineHash}
							</code>
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
						<h3 className="text-base font-bold text-text font-display">Revogar Licença</h3>
						<button
							type="button"
							onClick={() => setConfirmRevoke(false)}
							className="p-1 border border-border text-text-muted hover:text-text hover:bg-surface-hover transition-all"
						>
							<X size={16} />
						</button>
					</div>
					<p className="text-xs text-text-muted mb-6 leading-relaxed">
						Tem certeza que deseja revogar a licença? Esta acção não pode ser
						desfeita. Precisará de uma nova chave para reactivar.
					</p>
					<div className="flex gap-3">
						<button
							type="button"
							onClick={() => setConfirmRevoke(false)}
							className="flex-1 py-2 text-xs font-semibold text-text-muted border border-border hover:bg-surface-hover transition-all"
						>
							Cancelar
						</button>
						<button
							type="button"
							onClick={handleRevoke}
							disabled={revoking}
							className="flex-1 py-2 text-xs font-semibold text-white bg-error border border-error hover:bg-error/80 transition-all disabled:opacity-50"
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
			<span className="text-xs font-medium text-text-muted">{label}</span>
			<div className="text-right">{value}</div>
		</div>
	);
}
