"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { FloatingLabelInput } from "@/components/FloatingLabelInput";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
	Shield,
	LayoutDashboard,
	Key,
	Plus,
	CreditCard,
	FileCheck,
	Landmark,
	Loader,
	Loader2,
	Copy,
	Check,
	X,
	Pencil,
	Save,
	ExternalLink,
	ArrowRight,
	ArrowLeft,
	Lock,
	CheckCircle2,
	Clock,
	XCircle,
	TrendingUp,
	Wrench,
	ChevronRight,
} from "lucide-react";

type Tab =
	| "dashboard"
	| "licenses"
	| "generate"
	| "plans"
	| "payments"
	| "payment-info"
	| "maintenance";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
	{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ id: "licenses", label: "Licenças", icon: Key },
	{ id: "generate", label: "Gerar Licenças", icon: Plus },
	{ id: "plans", label: "Planos", icon: CreditCard },
	{ id: "payments", label: "Pagamentos", icon: FileCheck },
	{ id: "maintenance", label: "Manutenção", icon: Wrench },
	{ id: "payment-info", label: "Dados Bancários", icon: Landmark },
];

export default function AdminPage() {
	const [authenticated, setAuthenticated] = useState<boolean | null>(null);
	const [activeTab, setActiveTab] = useState<Tab>("dashboard");

	useEffect(() => {
		const hasToken = document.cookie.includes("admin_token=");
		setAuthenticated(hasToken);
	}, []);

	if (authenticated === null) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-bg">
				<Loader2 size={24} className="text-primary animate-spin" />
			</div>
		);
	}

	if (!authenticated) {
		return <AdminLogin onSuccess={() => setAuthenticated(true)} />;
	}

	return (
		<div className="min-h-screen flex bg-bg">
			<aside className="w-56 bg-surface border-r border-border p-4 flex flex-col shrink-0">
				<div className="flex items-center gap-2.5 mb-8 px-2">
					<div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
						<Shield className="w-4.5 h-4.5 text-primary" />
					</div>
					<span className="text-lg font-display font-bold text-text">
						Admin
					</span>
				</div>
				<nav className="space-y-0.5">
					{TABS.map((tab) => (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={cn(
								"w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
								activeTab === tab.id
									? "bg-primary/15 text-primary"
									: "text-text-muted hover:text-text hover:bg-surface-hover",
							)}
						>
							<tab.icon size={16} />
							{tab.label}
						</button>
					))}
				</nav>
				<div className="mt-auto pt-4 border-t border-border">
					<button
						onClick={() => {
							document.cookie = "admin_token=; path=/; max-age=0";
							setAuthenticated(false);
						}}
						className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-error hover:bg-error/10 transition-all"
					>
						<X size={16} />
						Terminar Sessão
					</button>
				</div>
			</aside>

			<main className="flex-1 p-8 overflow-auto">
				{activeTab === "dashboard" && <DashboardTab />}
				{activeTab === "licenses" && (
					<LicensesTab onGenerate={() => setActiveTab("generate")} />
				)}
				{activeTab === "generate" && <GenerateTab />}
				{activeTab === "plans" && <PlansTab />}
				{activeTab === "payments" && <PaymentsTab />}
				{activeTab === "maintenance" && <MaintenanceTab />}
				{activeTab === "payment-info" && <PaymentInfoTab />}
			</main>
		</div>
	);
}

/* ─── Login ─── */

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
	const [step, setStep] = useState<"email" | "password">("email");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		try {
			const res = await fetch("/api/admin/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});
			const data = (await res.json()) as any;
			if (!res.ok) throw new Error(data.error || "Erro ao fazer login");
			onSuccess();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erro ao fazer login");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-bg text-text">
			<div className="p-10 flex flex-col items-center w-full max-w-[420px]">
				{step === "email" ? (
					<form
						onSubmit={(e) => {
							e.preventDefault();
							if (email) setStep("password");
						}}
						className="space-y-5 w-full"
					>
						<p className="text-sm text-text-muted">
							Insira o email de administrador
						</p>
						<FloatingLabelInput
							id="email"
							label="Email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
						<button
							type="submit"
							disabled={!email}
							className="w-full bg-primary text-white font-semibold py-3 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
						>
							Continuar <ArrowRight size={18} />
						</button>
					</form>
				) : (
					<form onSubmit={handleLogin} className="space-y-5 w-full">
						<button
							type="button"
							onClick={() => {
								setStep("email");
								setPassword("");
								setError("");
							}}
							className="flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors"
						>
							<ArrowLeft size={14} /> Voltar
						</button>
						<p className="text-sm text-text-muted">
							Entrar como <span className="text-text font-medium">{email}</span>
						</p>
						{error && <Alert variant="error">{error}</Alert>}
						<div>
							<label className="text-xs tracking-widest text-text-muted flex items-center gap-2 uppercase mb-2">
								<Lock size={12} /> Palavra-passe
							</label>
							<input
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								autoFocus
								placeholder="••••••••"
								className="w-full h-12 px-4 bg-transparent border-b-2 border-border text-text font-bold focus:border-primary focus:outline-none transition-colors caret-primary"
							/>
						</div>
						<button
							type="submit"
							disabled={loading || !password}
							className="w-full bg-primary text-white font-semibold py-3 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
						>
							{loading ? (
								<Loader size={16} className="animate-spin" />
							) : (
								<>
									Entrar <ArrowRight size={16} />
								</>
							)}
						</button>
					</form>
				)}
			</div>
		</div>
	);
}

/* ─── Dashboard ─── */

function DashboardTab() {
	const [stats, setStats] = useState({
		total: 0,
		active: 0,
		pending: 0,
		revoked: 0,
	});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch("/api/admin/licenses")
			.then((r) => r.json())
			.then((data) => {
				if (Array.isArray(data)) {
					setStats({
						total: data.length,
						active: data.filter(
							(l: { status: string }) => l.status === "ACTIVE",
						).length,
						pending: data.filter(
							(l: { status: string }) => l.status === "PENDING",
						).length,
						revoked: data.filter(
							(l: { status: string }) => l.status === "REVOKED",
						).length,
					});
				}
			})
			.catch(() => {})
			.finally(() => setLoading(false));
	}, []);

	const cards = [
		{
			label: "Total",
			value: stats.total,
			icon: Key,
			color: "text-text",
			bg: "bg-primary/15",
		},
		{
			label: "Activas",
			value: stats.active,
			icon: CheckCircle2,
			color: "text-success",
			bg: "bg-success/15",
		},
		{
			label: "Pendentes",
			value: stats.pending,
			icon: Clock,
			color: "text-warning",
			bg: "bg-warning/15",
		},
		{
			label: "Revogadas",
			value: stats.revoked,
			icon: XCircle,
			color: "text-error",
			bg: "bg-error/15",
		},
	];

	return (
		<div>
			<div className="flex items-center gap-2.5 mb-6">
				<LayoutDashboard className="w-5 h-5 text-primary" />
				<h1 className="text-xl font-display font-bold text-text">Dashboard</h1>
			</div>
			{loading ? (
				<div className="py-16 text-center text-text-muted">
					<Loader2 size={20} className="animate-spin mx-auto" />
				</div>
			) : (
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					{cards.map((c) => (
						<div
							key={c.label}
							className="border border-border bg-surface rounded-xl p-5"
						>
							<div className="flex items-start justify-between">
								<div>
									<p className="text-text-muted text-xs font-medium">
										{c.label}
									</p>
									<p className={`text-3xl font-bold mt-1.5 ${c.color}`}>
										{c.value}
									</p>
								</div>
								<div
									className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center`}
								>
									<c.icon size={18} className={c.color} />
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

/* ─── Licenses ─── */

function LicensesTab({ onGenerate }: { onGenerate: () => void }) {
	const [licenses, setLicenses] = useState<
		Array<{
			id: string;
			key: string;
			type: string;
			durationDays: number;
			status: string;
			createdAt: string;
			license?: { user?: { email: string } };
		}>
	>([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState<string | null>(null);

	const fetchLicenses = useCallback(async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/admin/licenses");
			if (res.ok) {
				const data = (await res.json()) as any;
				if (Array.isArray(data)) setLicenses(data);
			}
		} catch {
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchLicenses();
	}, [fetchLicenses]);

	const filtered = filter
		? licenses.filter((l) => l.status === filter)
		: licenses;
	const badge = (s: string) =>
		s === "ACTIVE"
			? "bg-success/15 text-success"
			: s === "PENDING"
				? "bg-warning/15 text-warning"
				: "bg-error/15 text-error";

	return (
		<div>
			<div className="flex items-center justify-between mb-5">
				<div className="flex items-center gap-2.5">
					<Key className="w-5 h-5 text-primary" />
					<h1 className="text-xl font-display font-bold text-text">Licenças</h1>
				</div>
				<button
					onClick={onGenerate}
					className="bg-primary text-white px-4 py-2 rounded-lg text-xs font-bold hover:brightness-110 flex items-center gap-1.5"
				>
					<Plus size={14} /> Gerar
				</button>
			</div>

			<div className="flex gap-1.5 mb-4">
				{[null, "PENDING", "ACTIVE", "REVOKED"].map((f) => (
					<button
						key={f ?? "all"}
						onClick={() => setFilter(f)}
						className={cn(
							"px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
							filter === f
								? "bg-primary/15 text-primary"
								: "text-text-muted hover:text-text hover:bg-surface-hover",
						)}
					>
						{f === null
							? "Todas"
							: f === "PENDING"
								? "Pendentes"
								: f === "ACTIVE"
									? "Activas"
									: "Revogadas"}
					</button>
				))}
			</div>

			{loading ? (
				<div className="py-12 text-center text-text-muted">
					<Loader2 size={20} className="animate-spin mx-auto" />
				</div>
			) : filtered.length === 0 ? (
				<div className="py-16 text-center text-text-muted text-sm">
					Nenhuma licença encontrada
				</div>
			) : (
				<div className="border border-border bg-surface rounded-xl overflow-hidden">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-border">
								<th className="text-left px-5 py-3 text-xs text-text-muted font-medium uppercase">
									Chave
								</th>
								<th className="text-left px-5 py-3 text-xs text-text-muted font-medium uppercase">
									Tipo
								</th>
								<th className="text-left px-5 py-3 text-xs text-text-muted font-medium uppercase">
									Duração
								</th>
								<th className="text-left px-5 py-3 text-xs text-text-muted font-medium uppercase">
									Estado
								</th>
								<th className="text-left px-5 py-3 text-xs text-text-muted font-medium uppercase">
									Utilizador
								</th>
								<th className="text-left px-5 py-3 text-xs text-text-muted font-medium uppercase">
									Criada
								</th>
							</tr>
						</thead>
						<tbody>
							{filtered.map((l) => (
								<tr key={l.id} className="border-b border-border last:border-0">
									<td className="px-5 py-3 font-mono text-primary text-xs">
										{l.key}
									</td>
									<td className="px-5 py-3 text-text-muted">{l.type}</td>
									<td className="px-5 py-3 text-text-muted">
										{l.durationDays}d
									</td>
									<td className="px-5 py-3">
										<span
											className={cn(
												"px-2 py-0.5 rounded text-xs font-medium",
												badge(l.status),
											)}
										>
											{l.status}
										</span>
									</td>
									<td className="px-5 py-3 text-text-muted text-xs">
										{l.license?.user?.email || "---"}
									</td>
									<td className="px-5 py-3 text-text-muted text-xs">
										{new Date(l.createdAt).toLocaleDateString("pt-PT")}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}

/* ─── Generate ─── */

function GenerateTab() {
	const [type, setType] = useState<"B2C" | "B2B">("B2C");
	const [durationDays, setDurationDays] = useState(30);
	const [quantity, setQuantity] = useState(1);
	const [batchName, setBatchName] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [generated, setGenerated] = useState<string[]>([]);
	const [copied, setCopied] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		try {
			const res = await fetch("/api/admin/licenses/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ type, durationDays, quantity, batchName }),
			});
			const data = (await res.json()) as any;
			if (!res.ok) throw new Error(data.error);
			setGenerated(data.licenses.map((l: { key: string }) => l.key));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erro");
		} finally {
			setLoading(false);
		}
	};

	const copyAll = () => {
		navigator.clipboard.writeText(generated.join("\n"));
		setCopied("all");
		setTimeout(() => setCopied(null), 2000);
	};
	const copyOne = (k: string) => {
		navigator.clipboard.writeText(k);
		setCopied(k);
		setTimeout(() => setCopied(null), 2000);
	};

	return (
		<div>
			<div className="flex items-center gap-2.5 mb-6">
				<Plus className="w-5 h-5 text-primary" />
				<h1 className="text-xl font-display font-bold text-text">
					Gerar Licenças
				</h1>
			</div>

			<div className="max-w-lg border border-border bg-surface rounded-xl p-6">
				<form onSubmit={handleSubmit} className="space-y-4">
					{error && <Alert variant="error">{error}</Alert>}
					<div>
						<label className="text-xs text-text-muted mb-1.5 block">Tipo</label>
						<select
							value={type}
							onChange={(e) => setType(e.target.value as "B2C" | "B2B")}
							className="h-10 w-full rounded-lg border border-border bg-bg px-3 text-sm text-text focus:outline-none focus:border-primary"
						>
							<option value="B2C">B2C</option>
							<option value="B2B">B2B</option>
						</select>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-xs text-text-muted mb-1.5 block">
								Duração (dias)
							</label>
							<input
								type="number"
								value={durationDays}
								onChange={(e) => setDurationDays(parseInt(e.target.value))}
								min={1}
								className="h-10 w-full rounded-lg border border-border bg-bg px-3 text-sm text-text focus:outline-none focus:border-primary"
							/>
						</div>
						<div>
							<label className="text-xs text-text-muted mb-1.5 block">
								Quantidade
							</label>
							<input
								type="number"
								value={quantity}
								onChange={(e) => setQuantity(parseInt(e.target.value))}
								min={1}
								max={100}
								className="h-10 w-full rounded-lg border border-border bg-bg px-3 text-sm text-text focus:outline-none focus:border-primary"
							/>
						</div>
					</div>
					<div>
						<label className="text-xs text-text-muted mb-1.5 block">
							Nome do Lote (opcional)
						</label>
						<input
							type="text"
							value={batchName}
							onChange={(e) => setBatchName(e.target.value)}
							placeholder="Ex: Julho 2026"
							className="h-10 w-full rounded-lg border border-border bg-bg px-3 text-sm text-text focus:outline-none focus:border-primary"
						/>
					</div>
					<button
						type="submit"
						disabled={loading}
						className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-bold hover:brightness-110 flex items-center justify-center gap-2 disabled:opacity-50"
					>
						{loading ? (
							<>
								<Loader2 size={14} className="animate-spin" /> A gerar...
							</>
						) : (
							"Gerar Licenças"
						)}
					</button>
				</form>
			</div>

			{generated.length > 0 && (
				<div className="mt-6 border border-border bg-surface rounded-xl p-5">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-sm font-semibold text-text">
							Geradas ({generated.length})
						</h2>
						<div className="flex gap-2">
							<button
								onClick={copyAll}
								className="text-xs text-text-muted hover:text-text flex items-center gap-1 px-2 py-1 rounded hover:bg-surface-hover transition-all"
							>
								{copied === "all" ? (
									<Check size={12} className="text-success" />
								) : (
									<Copy size={12} />
								)}{" "}
								Copiar todas
							</button>
							<button
								onClick={() => setGenerated([])}
								className="text-xs text-text-muted hover:text-text px-2 py-1 rounded hover:bg-surface-hover transition-all"
							>
								Limpar
							</button>
						</div>
					</div>
					<div className="space-y-1.5 max-h-56 overflow-y-auto scrollbar-thin">
						{generated.map((k) => (
							<div
								key={k}
								className="flex items-center justify-between p-2.5 bg-bg rounded-lg border border-border"
							>
								<code className="text-primary font-mono text-xs">{k}</code>
								<button
									onClick={() => copyOne(k)}
									className="text-text-muted hover:text-text p-1"
								>
									{copied === k ? (
										<Check size={12} className="text-success" />
									) : (
										<Copy size={12} />
									)}
								</button>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

/* ─── Plans ─── */

interface PlanFeature {
	id: string;
	name: string;
	description: string | null;
	price: number;
	isActive: boolean;
}
interface PlanService {
	id: string;
	name: string;
	description: string | null;
	price: number;
	isActive: boolean;
}
interface Plan {
	id: string;
	name: string;
	description: string | null;
	basePrice: number;
	durationDays: number;
	isActive: boolean;
	isDefault: boolean;
	features: PlanFeature[];
	services: PlanService[];
}

function PlansTab() {
	const [plans, setPlans] = useState<Plan[]>([]);
	const [loading, setLoading] = useState(true);
	const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
	const [editing, setEditing] = useState<Plan | null>(null);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [basePrice, setBasePrice] = useState("");
	const [durationDays, setDurationDays] = useState("");
	const [saving, setSaving] = useState(false);

	const [featName, setFeatName] = useState("");
	const [featDesc, setFeatDesc] = useState("");
	const [featPrice, setFeatPrice] = useState("0");
	const [svcName, setSvcName] = useState("");
	const [svcDesc, setSvcDesc] = useState("");
	const [svcPrice, setSvcPrice] = useState("0");

	const fetchPlans = useCallback(async () => {
		try {
			const r = await fetch("/api/admin/plans");
			if (r.ok) {
				const d = await r.json();
				if (Array.isArray(d)) setPlans(d as any);
			}
		} catch {
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchPlans();
	}, [fetchPlans]);

	const handleSave = async () => {
		if (!name || !basePrice || !durationDays) return;
		setSaving(true);
		try {
			await fetch("/api/admin/plans", {
				method: editing ? "PUT" : "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(
					editing
						? {
								id: editing.id,
								name,
								description,
								basePrice: Number(basePrice),
								durationDays: Number(durationDays),
							}
						: {
								name,
								description,
								basePrice: Number(basePrice),
								durationDays: Number(durationDays),
							},
				),
			});
			setEditing(null);
			setName("");
			setDescription("");
			setBasePrice("");
			setDurationDays("");
			fetchPlans();
		} catch {
		} finally {
			setSaving(false);
		}
	};

	const toggleActive = async (p: Plan) => {
		await fetch("/api/admin/plans", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id: p.id, isActive: !p.isActive }),
		});
		fetchPlans();
	};

	const addFeature = async (planId: string) => {
		if (!featName) return;
		await fetch(`/api/admin/plans/${planId}/features`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name: featName,
				description: featDesc,
				price: Number(featPrice),
			}),
		});
		setFeatName("");
		setFeatDesc("");
		setFeatPrice("0");
		fetchPlans();
	};

	const deleteFeature = async (planId: string, featureId: string) => {
		await fetch(`/api/admin/plans/${planId}/features?featureId=${featureId}`, {
			method: "DELETE",
		});
		fetchPlans();
	};

	const addService = async (planId: string) => {
		if (!svcName) return;
		await fetch(`/api/admin/plans/${planId}/services`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name: svcName,
				description: svcDesc,
				price: Number(svcPrice),
			}),
		});
		setSvcName("");
		setSvcDesc("");
		setSvcPrice("0");
		fetchPlans();
	};

	const deleteService = async (planId: string, serviceId: string) => {
		await fetch(`/api/admin/plans/${planId}/services?serviceId=${serviceId}`, {
			method: "DELETE",
		});
		fetchPlans();
	};

	return (
		<div>
			<div className="flex items-center justify-between mb-5">
				<div className="flex items-center gap-2.5">
					<CreditCard className="w-5 h-5 text-primary" />
					<h1 className="text-xl font-display font-bold text-text">Planos</h1>
				</div>
				<button
					onClick={() => {
						setEditing(null);
						setName("");
						setDescription("");
						setBasePrice("");
						setDurationDays("");
					}}
					className="bg-primary text-white px-4 py-2 rounded-lg text-xs font-bold hover:brightness-110 flex items-center gap-1.5"
				>
					<Plus size={14} /> Novo Plano
				</button>
			</div>

			{(editing || false) && (
				<div className="border border-border bg-surface rounded-xl p-5 mb-5 space-y-3">
					<div className="flex items-center justify-between">
						<h2 className="text-sm font-semibold text-text">
							{editing ? "Editar" : "Novo"} Plano
						</h2>
						<button
							onClick={() => setEditing(null)}
							className="text-text-muted hover:text-text"
						>
							<X size={16} />
						</button>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Nome (ex: B2C)"
							className="h-10 px-3 bg-bg border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary"
						/>
						<input
							type="number"
							step="0.01"
							value={basePrice}
							onChange={(e) => setBasePrice(e.target.value)}
							placeholder="Preço Base ($)"
							className="h-10 px-3 bg-bg border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary"
						/>
						<input
							type="number"
							value={durationDays}
							onChange={(e) => setDurationDays(e.target.value)}
							placeholder="Duração (dias)"
							className="h-10 px-3 bg-bg border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary"
						/>
						<input
							type="text"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Descrição"
							className="h-10 px-3 bg-bg border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary"
						/>
					</div>
					<button
						onClick={handleSave}
						disabled={!name || !basePrice || !durationDays || saving}
						className="bg-primary text-white px-5 py-2 rounded-lg text-xs font-bold hover:brightness-110 flex items-center gap-1.5 disabled:opacity-50"
					>
						{saving && <Loader size={12} className="animate-spin" />}
						{editing ? "Guardar" : "Criar"}
					</button>
				</div>
			)}

			{loading ? (
				<div className="py-12 text-center text-text-muted">
					<Loader2 size={20} className="animate-spin mx-auto" />
				</div>
			) : plans.length === 0 ? (
				<div className="py-16 text-center text-text-muted text-sm">
					Nenhum plano criado
				</div>
			) : (
				<div className="space-y-4">
					{plans.map((p) => (
						<div
							key={p.id}
							className="border border-border bg-surface rounded-xl overflow-hidden"
						>
							<div className="flex items-center justify-between p-4">
								<div className="flex items-center gap-4">
									<button
										onClick={() =>
											setExpandedPlan(expandedPlan === p.id ? null : p.id)
										}
										className="text-text-muted hover:text-text"
									>
										<ChevronRight
											size={16}
											className={cn(
												"transition-transform",
												expandedPlan === p.id && "rotate-90",
											)}
										/>
									</button>
									<div>
										<p className="text-text font-semibold">{p.name}</p>
										{p.description && (
											<p className="text-xs text-text-muted">{p.description}</p>
										)}
									</div>
								</div>
								<div className="flex items-center gap-4">
									<span className="text-text font-bold">
										${p.basePrice.toFixed(2)}
									</span>
									<span className="text-text-muted text-xs">
										{p.durationDays}d
									</span>
									<button
										onClick={() => toggleActive(p)}
										className={cn(
											"px-2 py-0.5 rounded text-xs font-medium",
											p.isActive
												? "bg-success/15 text-success"
												: "bg-error/15 text-error",
										)}
									>
										{p.isActive ? "Ativo" : "Inativo"}
									</button>
									<button
										onClick={() => {
											setEditing(p);
											setName(p.name);
											setDescription(p.description || "");
											setBasePrice(String(p.basePrice));
											setDurationDays(String(p.durationDays));
										}}
										className="p-1.5 text-text-muted hover:text-text rounded hover:bg-surface-hover"
									>
										<Pencil size={13} />
									</button>
								</div>
							</div>

							{expandedPlan === p.id && (
								<div className="border-t border-border p-4 space-y-5">
									<div>
										<h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
											Features
										</h3>
										{p.features.length > 0 ? (
											<div className="space-y-1.5 mb-3">
												{p.features.map((f) => (
													<div
														key={f.id}
														className="flex items-center justify-between px-3 py-2 bg-bg rounded-lg"
													>
														<div>
															<span className="text-sm text-text">
																{f.name}
															</span>
															<span className="text-xs text-text-muted ml-2">
																${f.price.toFixed(2)}
															</span>
														</div>
														<button
															onClick={() => deleteFeature(p.id, f.id)}
															className="text-text-muted hover:text-error"
														>
															<X size={12} />
														</button>
													</div>
												))}
											</div>
										) : (
											<p className="text-xs text-text-muted mb-3">
												Nenhuma feature
											</p>
										)}
										<div className="flex gap-2">
											<input
												type="text"
												value={featName}
												onChange={(e) => setFeatName(e.target.value)}
												placeholder="Nome"
												className="h-8 px-2 bg-bg border border-border rounded text-xs text-text focus:outline-none focus:border-primary flex-1"
											/>
											<input
												type="text"
												value={featDesc}
												onChange={(e) => setFeatDesc(e.target.value)}
												placeholder="Descrição"
												className="h-8 px-2 bg-bg border border-border rounded text-xs text-text focus:outline-none focus:border-primary flex-1"
											/>
											<input
												type="number"
												step="0.01"
												value={featPrice}
												onChange={(e) => setFeatPrice(e.target.value)}
												placeholder="$"
												className="h-8 w-20 px-2 bg-bg border border-border rounded text-xs text-text focus:outline-none focus:border-primary"
											/>
											<button
												onClick={() => addFeature(p.id)}
												disabled={!featName}
												className="h-8 px-3 bg-primary/15 text-primary rounded text-xs font-medium hover:bg-primary/25 disabled:opacity-50"
											>
												Adicionar
											</button>
										</div>
									</div>

									<div>
										<h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
											Serviços
										</h3>
										{p.services.length > 0 ? (
											<div className="space-y-1.5 mb-3">
												{p.services.map((s) => (
													<div
														key={s.id}
														className="flex items-center justify-between px-3 py-2 bg-bg rounded-lg"
													>
														<div>
															<span className="text-sm text-text">
																{s.name}
															</span>
															<span className="text-xs text-text-muted ml-2">
																${s.price.toFixed(2)}
															</span>
														</div>
														<button
															onClick={() => deleteService(p.id, s.id)}
															className="text-text-muted hover:text-error"
														>
															<X size={12} />
														</button>
													</div>
												))}
											</div>
										) : (
											<p className="text-xs text-text-muted mb-3">
												Nenhum serviço
											</p>
										)}
										<div className="flex gap-2">
											<input
												type="text"
												value={svcName}
												onChange={(e) => setSvcName(e.target.value)}
												placeholder="Nome"
												className="h-8 px-2 bg-bg border border-border rounded text-xs text-text focus:outline-none focus:border-primary flex-1"
											/>
											<input
												type="text"
												value={svcDesc}
												onChange={(e) => setSvcDesc(e.target.value)}
												placeholder="Descrição"
												className="h-8 px-2 bg-bg border border-border rounded text-xs text-text focus:outline-none focus:border-primary flex-1"
											/>
											<input
												type="number"
												step="0.01"
												value={svcPrice}
												onChange={(e) => setSvcPrice(e.target.value)}
												placeholder="$"
												className="h-8 w-20 px-2 bg-bg border border-border rounded text-xs text-text focus:outline-none focus:border-primary"
											/>
											<button
												onClick={() => addService(p.id)}
												disabled={!svcName}
												className="h-8 px-3 bg-primary/15 text-primary rounded text-xs font-medium hover:bg-primary/25 disabled:opacity-50"
											>
												Adicionar
											</button>
										</div>
									</div>
								</div>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
}

/* ─── Maintenance ─── */

interface MaintenanceRequest {
	id: string;
	description: string;
	status: string;
	hasPaidLicense: boolean;
	adminNote: string | null;
	proofUrl: string | null;
	createdAt: string;
	user: { firstName: string; lastName: string; email: string };
}

function MaintenanceTab() {
	const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
	const [loading, setLoading] = useState(true);
	const [processing, setProcessing] = useState<string | null>(null);

	const fetchRequests = useCallback(async () => {
		try {
			const r = await fetch("/api/admin/maintenance");
			if (r.ok) {
				const d = await r.json();
				if (Array.isArray(d)) setRequests(d as any);
			}
		} catch {
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchRequests();
	}, [fetchRequests]);

	const handleAction = async (id: string, status: string) => {
		setProcessing(id);
		const note = status === "REJECTED" ? prompt("Nota (opcional):") || "" : "";
		try {
			await fetch(`/api/admin/maintenance/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status, adminNote: note }),
			});
		} catch {
		} finally {
			setProcessing(null);
			fetchRequests();
		}
	};

	const pending = requests.filter((r) => r.status === "PENDING");
	const processed = requests.filter((r) => r.status !== "PENDING");

	return (
		<div>
			<div className="flex items-center gap-2.5 mb-5">
				<Wrench className="w-5 h-5 text-primary" />
				<h1 className="text-xl font-display font-bold text-text">Manutenção</h1>
			</div>

			{loading ? (
				<div className="py-12 text-center text-text-muted">
					<Loader2 size={20} className="animate-spin mx-auto" />
				</div>
			) : requests.length === 0 ? (
				<div className="py-16 text-center text-text-muted text-sm">
					Nenhum pedido de manutenção
				</div>
			) : (
				<div className="space-y-6">
					{pending.length > 0 && (
						<div>
							<h2 className="text-sm font-semibold text-text mb-3">
								Pendentes ({pending.length})
							</h2>
							<div className="space-y-2.5">
								{pending.map((r) => (
									<div
										key={r.id}
										className="border border-border bg-surface rounded-xl p-4"
									>
										<div className="flex flex-col lg:flex-row lg:items-center gap-3">
											<div className="flex-1 min-w-0">
												<p className="text-text font-medium text-sm">
													{r.user.firstName} {r.user.lastName}
												</p>
												<p className="text-xs text-text-muted">
													{r.user.email}
												</p>
												<p className="text-sm text-text mt-2">
													{r.description}
												</p>
												<div className="flex items-center gap-2 mt-1.5">
													<span
														className={cn(
															"px-2 py-0.5 rounded text-xs font-medium",
															r.hasPaidLicense
																? "bg-success/15 text-success"
																: "bg-warning/15 text-warning",
														)}
													>
														{r.hasPaidLicense ? "Licença Paga" : "Sem Licença"}
													</span>
													<span className="text-xs text-text-muted">
														{new Date(r.createdAt).toLocaleString("pt-PT")}
													</span>
												</div>
											</div>
											<div className="flex items-center gap-1.5">
												{r.proofUrl && (
													<a
														href={r.proofUrl}
														target="_blank"
														rel="noopener noreferrer"
														className="px-2.5 py-1.5 text-xs font-medium text-primary border border-border rounded-lg hover:bg-surface-hover flex items-center gap-1"
													>
														<ExternalLink size={11} /> Ver
													</a>
												)}
												<button
													onClick={() => handleAction(r.id, "IN_PROGRESS")}
													disabled={processing === r.id}
													className="px-2.5 py-1.5 text-xs font-medium text-white bg-primary rounded-lg hover:brightness-110 flex items-center gap-1 disabled:opacity-50"
												>
													{processing === r.id ? (
														<Loader size={11} className="animate-spin" />
													) : (
														<Check size={11} />
													)}{" "}
													Iniciar
												</button>
												<button
													onClick={() => handleAction(r.id, "RESOLVED")}
													disabled={processing === r.id}
													className="px-2.5 py-1.5 text-xs font-medium text-white bg-success rounded-lg hover:brightness-110 flex items-center gap-1 disabled:opacity-50"
												>
													<CheckCircle2 size={11} /> Resolvido
												</button>
												<button
													onClick={() => handleAction(r.id, "REJECTED")}
													disabled={processing === r.id}
													className="px-2.5 py-1.5 text-xs font-medium text-white bg-error rounded-lg hover:brightness-110 flex items-center gap-1 disabled:opacity-50"
												>
													<X size={11} /> Rejeitar
												</button>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{processed.length > 0 && (
						<div>
							<h2 className="text-sm font-semibold text-text mb-3">
								Processados ({processed.length})
							</h2>
							<div className="border border-border bg-surface rounded-xl overflow-hidden">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b border-border">
											<th className="text-left px-5 py-3 text-xs text-text-muted font-medium uppercase">
												Utilizador
											</th>
											<th className="text-left px-5 py-3 text-xs text-text-muted font-medium uppercase">
												Descrição
											</th>
											<th className="text-left px-5 py-3 text-xs text-text-muted font-medium uppercase">
												Estado
											</th>
											<th className="text-left px-5 py-3 text-xs text-text-muted font-medium uppercase">
												Data
											</th>
										</tr>
									</thead>
									<tbody>
										{processed.map((r) => (
											<tr
												key={r.id}
												className="border-b border-border last:border-0"
											>
												<td className="px-5 py-3">
													<p className="text-text text-xs">
														{r.user.firstName} {r.user.lastName}
													</p>
													<p className="text-xs text-text-muted">
														{r.user.email}
													</p>
												</td>
												<td className="px-5 py-3 text-xs text-text max-w-xs truncate">
													{r.description}
												</td>
												<td className="px-5 py-3">
													<span
														className={cn(
															"px-2 py-0.5 rounded text-xs font-medium",
															r.status === "RESOLVED"
																? "bg-success/15 text-success"
																: r.status === "IN_PROGRESS"
																	? "bg-primary/15 text-primary"
																	: "bg-error/15 text-error",
														)}
													>
														{r.status === "RESOLVED"
															? "Resolvido"
															: r.status === "IN_PROGRESS"
																? "Em Progresso"
																: "Rejeitado"}
													</span>
													{r.adminNote && (
														<p className="text-xs text-text-muted mt-0.5 italic">
															{r.adminNote}
														</p>
													)}
												</td>
												<td className="px-5 py-3 text-xs text-text-muted">
													{new Date(r.createdAt).toLocaleDateString("pt-PT")}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

/* ─── Payments ─── */

interface PaymentRequest {
	id: string;
	status: string;
	proofUrl: string;
	adminNote: string | null;
	totalPrice: number | null;
	createdAt: string;
	plan: { name: string; basePrice: number };
	user: { firstName: string; lastName: string; email: string };
}

function PaymentsTab() {
	const [payments, setPayments] = useState<PaymentRequest[]>([]);
	const [loading, setLoading] = useState(true);
	const [processing, setProcessing] = useState<string | null>(null);

	const fetchPayments = useCallback(async () => {
		try {
			const r = await fetch("/api/admin/payments");
			if (r.ok) {
				const d = await r.json();
				if (Array.isArray(d)) setPayments(d as any);
			}
		} catch {
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchPayments();
	}, [fetchPayments]);

	const handleAction = async (id: string, status: "APPROVED" | "REJECTED") => {
		setProcessing(id);
		const note = status === "REJECTED" ? prompt("Nota (opcional):") || "" : "";
		try {
			await fetch(`/api/admin/payments/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status, adminNote: note }),
			});
		} catch {
		} finally {
			setProcessing(null);
			fetchPayments();
		}
	};

	const pending = payments.filter((p) => p.status === "PENDING");
	const processed = payments.filter((p) => p.status !== "PENDING");

	return (
		<div>
			<div className="flex items-center gap-2.5 mb-5">
				<FileCheck className="w-5 h-5 text-primary" />
				<h1 className="text-xl font-display font-bold text-text">Pagamentos</h1>
			</div>

			{loading ? (
				<div className="py-12 text-center text-text-muted">
					<Loader2 size={20} className="animate-spin mx-auto" />
				</div>
			) : payments.length === 0 ? (
				<div className="py-16 text-center text-text-muted text-sm">
					Nenhum pedido de pagamento
				</div>
			) : (
				<div className="space-y-6">
					{pending.length > 0 && (
						<div>
							<h2 className="text-sm font-semibold text-text mb-3">
								Pendentes ({pending.length})
							</h2>
							<div className="space-y-2.5">
								{pending.map((p) => (
									<div
										key={p.id}
										className="border border-border bg-surface rounded-xl p-4"
									>
										<div className="flex flex-col lg:flex-row lg:items-center gap-3">
											<div className="flex-1 min-w-0">
												<p className="text-text font-medium text-sm">
													{p.user.firstName} {p.user.lastName}
												</p>
												<p className="text-xs text-text-muted">
													{p.user.email}
												</p>
												<p className="text-xs text-text-muted mt-1">
													{p.plan.name} — $
													{p.totalPrice
														? p.totalPrice.toFixed(2)
														: p.plan.basePrice.toFixed(2)}
												</p>
												<p className="text-xs text-text-muted">
													{new Date(p.createdAt).toLocaleString("pt-PT")}
												</p>
											</div>
											<div className="flex items-center gap-1.5">
												<a
													href={p.proofUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="px-2.5 py-1.5 text-xs font-medium text-primary border border-border rounded-lg hover:bg-surface-hover flex items-center gap-1"
												>
													<ExternalLink size={11} /> Ver
												</a>
												<button
													onClick={() => handleAction(p.id, "APPROVED")}
													disabled={processing === p.id}
													className="px-2.5 py-1.5 text-xs font-medium text-white bg-success rounded-lg hover:brightness-110 flex items-center gap-1 disabled:opacity-50"
												>
													{processing === p.id ? (
														<Loader size={11} className="animate-spin" />
													) : (
														<Check size={11} />
													)}{" "}
													Aprovar
												</button>
												<button
													onClick={() => handleAction(p.id, "REJECTED")}
													disabled={processing === p.id}
													className="px-2.5 py-1.5 text-xs font-medium text-white bg-error rounded-lg hover:brightness-110 flex items-center gap-1 disabled:opacity-50"
												>
													<X size={11} /> Rejeitar
												</button>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{processed.length > 0 && (
						<div>
							<h2 className="text-sm font-semibold text-text mb-3">
								Processados ({processed.length})
							</h2>
							<div className="border border-border bg-surface rounded-xl overflow-hidden">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b border-border">
											<th className="text-left px-5 py-3 text-xs text-text-muted font-medium uppercase">
												Utilizador
											</th>
											<th className="text-left px-5 py-3 text-xs text-text-muted font-medium uppercase">
												Plano
											</th>
											<th className="text-left px-5 py-3 text-xs text-text-muted font-medium uppercase">
												Estado
											</th>
											<th className="text-left px-5 py-3 text-xs text-text-muted font-medium uppercase">
												Data
											</th>
										</tr>
									</thead>
									<tbody>
										{processed.map((p) => (
											<tr
												key={p.id}
												className="border-b border-border last:border-0"
											>
												<td className="px-5 py-3">
													<p className="text-text text-xs">
														{p.user.firstName} {p.user.lastName}
													</p>
													<p className="text-xs text-text-muted">
														{p.user.email}
													</p>
												</td>
												<td className="px-5 py-3 text-xs text-text">
													{p.plan.name}
												</td>
												<td className="px-5 py-3">
													<span
														className={cn(
															"px-2 py-0.5 rounded text-xs font-medium",
															p.status === "APPROVED"
																? "bg-success/15 text-success"
																: "bg-error/15 text-error",
														)}
													>
														{p.status === "APPROVED" ? "Aprovado" : "Rejeitado"}
													</span>
													{p.adminNote && (
														<p className="text-xs text-text-muted mt-0.5 italic">
															{p.adminNote}
														</p>
													)}
												</td>
												<td className="px-5 py-3 text-xs text-text-muted">
													{new Date(p.createdAt).toLocaleDateString("pt-PT")}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

/* ─── Payment Info ─── */

function PaymentInfoTab() {
	const [info, setInfo] = useState<{
		id: string;
		iban: string;
		accountName: string;
		bankName: string | null;
		reference: string | null;
	} | null>(null);
	const [iban, setIban] = useState("");
	const [accountName, setAccountName] = useState("");
	const [bankName, setBankName] = useState("");
	const [reference, setReference] = useState("");
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);

	useEffect(() => {
		fetch("/api/admin/payment-info")
			.then((r) => r.json())
			.then((data: any) => {
				if (data) {
					setInfo(data);
					setIban(data.iban);
					setAccountName(data.accountName);
					setBankName(data.bankName || "");
					setReference(data.reference || "");
				}
			})
			.finally(() => setLoading(false));
	}, []);

	const handleSave = async () => {
		if (!iban || !accountName) return;
		setSaving(true);
		setSaved(false);
		try {
			const r = await fetch("/api/admin/payment-info", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ iban, accountName, bankName, reference }),
			});
			if (r.ok) {
				const d = await r.json();
				setInfo(d as any);
				setSaved(true);
				setTimeout(() => setSaved(false), 3000);
			}
		} finally {
			setSaving(false);
		}
	};

	if (loading)
		return (
			<div className="py-12 text-center text-text-muted">
				<Loader2 size={20} className="animate-spin mx-auto" />
			</div>
		);

	return (
		<div className="max-w-lg">
			<div className="flex items-center gap-2.5 mb-5">
				<Landmark className="w-5 h-5 text-primary" />
				<h1 className="text-xl font-display font-bold text-text">
					Dados Bancários
				</h1>
			</div>

			<div className="border border-border bg-surface rounded-xl p-6 space-y-4">
				<div className="space-y-3">
					<div>
						<label className="text-xs text-text-muted mb-1 block">IBAN</label>
						<input
							type="text"
							value={iban}
							onChange={(e) => setIban(e.target.value)}
							placeholder="PT50 0002 0000 0000 0000 0000 0"
							className="h-10 w-full px-3 bg-bg border border-border rounded-lg text-sm font-mono text-text focus:outline-none focus:border-primary"
						/>
					</div>
					<div>
						<label className="text-xs text-text-muted mb-1 block">
							Nome da Conta
						</label>
						<input
							type="text"
							value={accountName}
							onChange={(e) => setAccountName(e.target.value)}
							placeholder="Empresa Lda"
							className="h-10 w-full px-3 bg-bg border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary"
						/>
					</div>
					<div>
						<label className="text-xs text-text-muted mb-1 block">
							Banco (opcional)
						</label>
						<input
							type="text"
							value={bankName}
							onChange={(e) => setBankName(e.target.value)}
							placeholder="Millennium BCP"
							className="h-10 w-full px-3 bg-bg border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary"
						/>
					</div>
					<div>
						<label className="text-xs text-text-muted mb-1 block">
							Referência (opcional)
						</label>
						<input
							type="text"
							value={reference}
							onChange={(e) => setReference(e.target.value)}
							placeholder="926422462"
							className="h-10 w-full px-3 bg-bg border border-border rounded-lg text-sm font-mono text-text focus:outline-none focus:border-primary"
						/>
					</div>
				</div>
				<button
					onClick={handleSave}
					disabled={!iban || !accountName || saving}
					className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-bold hover:brightness-110 flex items-center gap-2 disabled:opacity-50"
				>
					{saving ? (
						<Loader size={14} className="animate-spin" />
					) : (
						<Save size={14} />
					)}
					{saved ? "Guardado!" : "Guardar"}
				</button>
			</div>
		</div>
	);
}
