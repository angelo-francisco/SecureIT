"use client";

import { useState, forwardRef, useImperativeHandle } from "react";
import { Shield, Key, X } from "lucide-react";
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
	ACTIVE: { label: "Activa", color: "text-success", bg: "bg-success/10" },
	APPROVED: { label: "Aprovada", color: "text-primary", bg: "bg-primary/10" },
	REVOKED: { label: "Revogada", color: "text-error", bg: "bg-error/10" },
	EXPIRED: { label: "Expirada", color: "text-text-muted", bg: "bg-white/[0.06]" },
	PENDING: { label: "Pendente", color: "text-warning", bg: "bg-warning/10" },
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
		? license.key.status === "ACTIVE" && new Date(license.expiresAt) > new Date()
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
				const data = await res.json();
				throw new Error(data.error);
			}
			setResponse((prev) =>
				prev
					? {
						...prev,
						license: prev.license
							? { ...prev.license, key: { ...prev.license.key, status: "REVOKED" } }
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
				<Key size={40} className="text-primary mx-auto mb-3" />
				<p className="text-base md:text-lg">
					Nenhuma licença registada
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<h1 className="text-lg font-bold text-text">
					{license.key.type} [<span
						className={`px-2 py-1 text-base font-bold ${statusInfo?.color} ${statusInfo?.bg}`}
					>
						{statusInfo?.label}
					</span>]
				</h1>
				<div className="flex gap-2 items-center justify-center">
					{isActive && (
						<button
							onClick={() => setConfirmRevoke(true)}
							className=" px-2 py-1 border text-base font-medium bg-red-500 text-white hover:text-error/80 transition-colors"
						>
							Revogar
						</button>
					)}

				</div>
			</div>

			<div className="border-t border-border/50 pt-3 space-y-1">
				<DetailRow
					label="Chave"
					value={license.key.key}
				/>
				<DetailRow
					label="Tipo"
					value={license.key.type === "B2B" ? "B2B" : "B2C"}
				/>
				<DetailRow
					label="Activada em"
					value={new Date(license.activatedAt).toLocaleDateString("pt-PT")}
				/>
				<DetailRow
					label="Expira em"
					value={new Date(license.expiresAt).toLocaleDateString("pt-PT")}
				/>
				<DetailRow
					label="Dias restantes"
					value={String(
						Math.max(
							0,
							Math.ceil(
								(new Date(license.expiresAt).getTime() - Date.now()) /
								(1000 * 60 * 60 * 24),
							),
						),
					)}
				/>
				{license.machineHash && (
					<DetailRow
						label="Máquina"
						value={
							<code className="font-mono text-xs break-all">
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
				<div className="bg-surface border border-border p-6">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-lg font-bold text-text">
							Revogar Licença
						</h3>
						<button
							onClick={() => setConfirmRevoke(false)}
							className="p-1.5 border text-text-muted hover:text-text hover:bg-surface-hover transition-all"
						>
							<X size={18} />
						</button>
					</div>
					<p className="text-base text-text-muted mb-6">
						Tem certeza que deseja revogar a licença? Esta acção não pode
						ser desfeita. Precisará de uma nova chave para reactivar.
					</p>
					<div className="flex gap-3">
						<button
							onClick={() => setConfirmRevoke(false)}
							className="flex-1 py-2.5 text-sm font-medium text-text-muted border border-border hover:bg-surface-hover transition-all"
						>
							Cancelar
						</button>
						<button
							onClick={handleRevoke}
							disabled={revoking}
							className="flex-1 py-2.5 text-sm font-medium text-white bg-error hover:bg-error/80 transition-all disabled:opacity-50"
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
		<div className="flex justify-between items-center">
			<span className="text-base text-text-muted">{label}</span>
			<span className="text-lg text-text">{value}</span>
		</div>
	);
}
