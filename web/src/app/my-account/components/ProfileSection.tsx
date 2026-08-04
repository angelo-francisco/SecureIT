"use client";

import { Check, KeyRound, Loader, Save } from "lucide-react";
import { useState } from "react";
import { MaterialPhoneInput } from "@/components/MaterialPhoneInput";
import { OutlinedInput } from "@/components/OutlinedInput";
import { useToast } from "@/packages/ui";

interface ProfileSectionProps {
	user: {
		firstName: string;
		lastName: string;
		email: string;
		phone: string;
		hasPin: boolean;
	};
	onSaved?: () => void;
}

export function ProfileSection({ user, onSaved }: ProfileSectionProps) {
	const { toast } = useToast();
	const [firstName, setFirstName] = useState(user.firstName);
	const [lastName, setLastName] = useState(user.lastName);
	const [phone, setPhone] = useState(user.phone);
	const [loading, setLoading] = useState(false);
	const [pinOpen, setPinOpen] = useState(false);
	const [pin, setPin] = useState("");
	const [pinSaving, setPinSaving] = useState(false);

	const isDirty =
		firstName !== user.firstName ||
		lastName !== user.lastName ||
		phone !== user.phone;

	const handlePinSave = async () => {
		if (!/^\d{4}$/.test(pin)) {
			toast("O PIN deve conter 4 dígitos");
			return;
		}
		setPinSaving(true);
		try {
			const res = await fetch("/api/auth/me", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ pin }),
			});
			if (!res.ok) {
				const data = (await res.json()) as { error?: string };
				throw new Error(data.error || "Erro ao guardar PIN");
			}
			toast("PIN definido com sucesso");
			setPinOpen(false);
			setPin("");
			onSaved?.();
		} catch (err) {
			toast(err instanceof Error ? err.message : "Erro ao guardar PIN");
		} finally {
			setPinSaving(false);
		}
	};

	const handleSave = async () => {
		if (!firstName.trim() || !lastName.trim()) {
			toast("Nome e apelido são obrigatórios");
			return;
		}
		setLoading(true);
		try {
			const res = await fetch("/api/auth/me", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					firstName: firstName.trim(),
					lastName: lastName.trim(),
					phone: phone || null,
				}),
			});
			if (!res.ok) {
				const data = (await res.json()) as { error?: string };
				throw new Error(data.error || "Erro ao guardar");
			}
			toast("Definições guardadas com sucesso");
			onSaved?.();
		} catch (err) {
			toast(err instanceof Error ? err.message : "Erro ao guardar");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="p-6 space-y-5">
			<div className="grid grid-cols-2 gap-4">
				<OutlinedInput
					id="firstName"
					label="Primeiro Nome"
					value={firstName}
					onChange={(e) => setFirstName(e.target.value)}
				/>
				<OutlinedInput
					id="lastName"
					label="Último Nome"
					value={lastName}
					onChange={(e) => setLastName(e.target.value)}
				/>
			</div>
			<div className="grid grid-cols-2 gap-4">
				<OutlinedInput
					id="email"
					label="Email"
					type="email"
					value={user.email}
					disabled
				/>
				<MaterialPhoneInput value={phone} onChange={(v) => setPhone(v ?? "")} />
			</div>
			<div className="border-t border-border pt-4">
				<button type="button"
					onClick={() => setPinOpen((v) => !v)}
					className="w-full flex items-center justify-between px-4 py-3 bg-bg border border-border hover:bg-surface-hover transition-all"
				>
					<div className="flex items-center gap-3">
						<KeyRound size={18} className="text-primary" />
						<span className="text-sm font-medium text-text">
							{user.hasPin ? "Alterar PIN" : "Definir PIN"}
						</span>
					</div>
					<span className="text-xs text-text-muted">
						{user.hasPin ? "● ● ● ●" : "---"}
					</span>
				</button>
				{pinOpen && (
					<div className="mt-3 space-y-3">
						<OutlinedInput
							id="pin"
							label="PIN (4 dígitos)"
							type="password"
							maxLength={4}
							inputMode="numeric"
							value={pin}
							onChange={(e) =>
								setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
							}
						/>
						<button type="button"
							onClick={handlePinSave}
							disabled={pinSaving || pin.length !== 4}
							className="w-full text-center bg-primary px-4 py-2 text-white text-sm font-bold hover:brightness-110 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
						>
							{pinSaving ? (
								<Loader size={16} className="animate-spin" />
							) : (
							<Check size={16} />
						)}
							{user.hasPin ? "Alterar PIN" : "Definir PIN"}
						</button>
					</div>
				)}
			</div>
			<div className="w-full flex items-center">
				<button type="button"
					onClick={handleSave}
					disabled={
						loading || !firstName.trim() || !lastName.trim() || !isDirty
					}
					className="cursor-poi.nc w-full text-center bg-primary px-4 py-2 text-white text-lg font-bold hover:brightness-110 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
				>
					{loading ? (
						<Loader size={20} className="animate-spin" />
					) : (
						<Save size={20} />
					)}
					Salvar Alterações
				</button>
			</div>
		</div>
	);
}
