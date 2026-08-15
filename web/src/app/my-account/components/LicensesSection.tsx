"use client";

import {
	Check,
	Clock3,
	Copy,
	Eye,
	EyeOff,
	Key,
	Monitor,
	ShieldCheck,
	ShieldX,
	X,
} from "lucide-react";
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
	{
		label: string;
		color: string;
		bg: string;
		border: string;
		icon: typeof ShieldCheck;
	}
> = {
	ACTIVE: {
		label: "Activa",
		color: "text-success",
		bg: "bg-success/10",
		border: "border-success/20",
		icon: ShieldCheck,
	},
	APPROVED: {
		label: "Aprovada",
		color: "text-primary",
		bg: "bg-primary/10",
		border: "border-primary/20",
		icon: ShieldCheck,
	},
	REVOKED: {
		label: "Revogada",
		color: "text-error",
		bg: "bg-error/10",
		border: "border-error/20",
		icon: ShieldX,
	},
	EXPIRED: {
		label: "Expirada",
		color: "text-text-muted",
		bg: "bg-surface",
		border: "border-border",
		icon: Clock3,
	},
	PENDING: {
		label: "Pendente",
		color: "text-warning",
		bg: "bg-warning/10",
		border: "border-warning/20",
		icon: Clock3,
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

	const license = response;

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(license?.key.key ?? "");
			setCopied(true);
			toast("Chave copiada para o clipboard");

			setTimeout(() => {
				setCopied(false);
			}, 2000);
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

	const StatusIcon = statusInfo?.icon ?? Clock3;

	const remainingDays = license
		? Math.max(
				0,
				Math.ceil(
					(new Date(license.expiresAt).getTime() - Date.now()) /
						(1000 * 60 * 60 * 24),
				),
			)
		: 0;

	const handleRevoke = async () => {
		setRevoking(true);

		try {
			const res = await fetch("/api/licenses/revoke", {
				method: "POST",
			});

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
								key: {
									...prev.key,
									status: "REVOKED",
								},
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
			<div className="relative overflow-hidden bg-surface">
				<div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />

				<div className="relative flex flex-col items-center justify-center px-6 py-14 text-center">
					<Key className="text-primary mb-2" size={30} />

					<h3 className="text-lg font-semibold text-text">
						Nenhuma licença activa
					</h3>

					<p className="mt-1 max-w-sm text-sm leading-6 text-text-muted">
						Não existe actualmente uma licença associada à sua conta.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-5">
			<div className="relative overflow-hidden bg-surface shadow-sm">
				<div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 bg-primary/10 blur-3xl" />

				<div className="relative">
					<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
						<div>
							<div className="flex flex-wrap items-center gap-3">
								<h2 className="font-display text-xl font-bold tracking-tight text-text">
									{license.key.type}
								</h2>
							</div>

							<p className="mt-1 text-sm text-text-muted">
								#{license.id.toUpperCase()}
							</p>
						</div>
						<div className="flex items-center gap-2">
							{statusInfo && (
								<div
									className={`inline-flex items-center gap-1.5 border px-2.5 py-2 text-sm font-bold ${statusInfo.color} ${statusInfo.bg} ${statusInfo.border}`}
								>
									<StatusIcon size={18} />
									{statusInfo.label}
								</div>
							)}
							{isActive && (
								<button
									type="button"
									onClick={() => setConfirmRevoke(true)}
									className="inline-flex border items-center justify-center hover:underline bg-error/5 px-4 py-2 text-sm font-semibold text-error transition-all hover:bg-error/10 active:scale-[0.98]"
								>
									Revogar licença
								</button>
							)}
						</div>
					</div>

					<div className="mt-6">
						<p className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-muted">
							Chave de licença
						</p>

						<div className="flex items-center gap-2 border border-border bg-background/50 px-3 py-2">
							<div className="min-w-0 flex-1">
								<p className="truncate font-mono text-sm font-medium tracking-wide text-text">
									{showKey ? license.key.key : "••••••••••••••••••••••••"}
								</p>
							</div>

							<button
								type="button"
								onClick={() => setShowKey((prev) => !prev)}
								className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
								aria-label={showKey ? "Ocultar chave" : "Ver chave"}
							>
								{showKey ? <EyeOff size={20} /> : <Eye size={20} />}
							</button>

							<button
								type="button"
								onClick={handleCopy}
								className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
								aria-label="Copiar chave"
							>
								{copied ? (
									<Check className="text-success" size={17} />
								) : (
									<Copy size={17} />
								)}
							</button>
						</div>
					</div>

					<div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
						<StatCard
							label="Activada em"
							value={new Date(license.activatedAt).toLocaleDateString("pt-PT")}
						/>

						<StatCard
							label="Expira em"
							value={new Date(license.expiresAt).toLocaleDateString("pt-PT")}
						/>

						<StatCard
							label="Dias restantes"
							value={`${remainingDays} dias`}
							highlight={isActive}
						/>
					</div>
				</div>
			</div>

			{license.machineHash && (
				<div className="bg-surface p-5">
					<div className="flex items-start gap-4">
						<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-background">
							<Monitor size={19} className="text-text-muted" />
						</div>

						<div className="min-w-0 flex-1">
							<p className="text-sm font-semibold text-text">
								Máquina associada
							</p>

							<p className="mt-1 text-xs text-text-muted">
								Esta licença está vinculada a este dispositivo.
							</p>

							<div className="mt-3 rounded-lg border border-border bg-background px-3 py-2.5">
								<p className="break-all font-mono text-xs leading-5 text-text-muted">
									{license.machineHash}
								</p>
							</div>
						</div>
					</div>
				</div>
			)}

			<Modal
				open={confirmRevoke}
				onClose={() => setConfirmRevoke(false)}
				className="w-full max-w-md mx-4"
			>
				<div className="overflow-hidden border border-border bg-surface shadow-2xl">
					<div className="flex items-start justify-between border-b border-border px-5 py-4">
						<div>
							<div className="flex items-center gap-2">
								<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-error/10">
									<ShieldX size={17} className="text-error" />
								</div>

								<h3 className="font-display text-base font-bold text-text">
									Revogar licença
								</h3>
							</div>

							<p className="mt-2 text-sm text-text-muted">
								Esta acção irá invalidar permanentemente a licença actual.
							</p>
						</div>

						<button
							type="button"
							onClick={() => setConfirmRevoke(false)}
							className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
						>
							<X size={17} />
						</button>
					</div>

					<div className="px-5 py-5">
						<div className="rounded-xl border border-error/10 bg-error/5 p-4">
							<p className="text-sm leading-6 text-text">
								Tem a certeza de que pretende revogar esta licença?
								<br />
								<span className="text-text-muted">
									Depois desta acção, será necessária uma nova chave para
									activar o produto novamente.
								</span>
							</p>
						</div>
					</div>

					<div className="flex gap-3 border-t border-border px-5 py-4">
						<button
							type="button"
							onClick={() => setConfirmRevoke(false)}
							className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
						>
							Cancelar
						</button>

						<button
							type="button"
							onClick={handleRevoke}
							disabled={revoking}
							className="flex-1 rounded-xl bg-error px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-error/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
						>
							{revoking ? "A revogar..." : "Confirmar revogação"}
						</button>
					</div>
				</div>
			</Modal>
		</div>
	);
});

LicensesSection.displayName = "LicensesSection";

function StatCard({
	label,
	value,
	highlight,
}: {
	label: string;
	value: string;
	highlight?: boolean;
}) {
	return (
		<div className="border border-border bg-background/40 p-4">
			<p className="text-xs font-medium uppercase tracking-wider text-text-muted">
				{label}
			</p>

			<p
				className={
					highlight
						? "mt-2 text-sm font-semibold text-primary"
						: "mt-2 text-sm font-semibold text-text"
				}
			>
				{value}
			</p>
		</div>
	);
}
