"use client";

import { Loader, Save } from "lucide-react";
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

	const isDirty =
		firstName !== user.firstName ||
		lastName !== user.lastName ||
		phone !== user.phone;

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
		<div className="space-y-5">
			<div className="grid grid-cols-2 gap-4">
				<OutlinedInput
					id="firstName"
					label="Primeiro Nome"
					value={firstName}
					labelBg="bg-accordion"
					onChange={(e) => setFirstName(e.target.value)}
				/>
				<OutlinedInput
					id="lastName"
					label="Último Nome"
					value={lastName}
					labelBg="bg-accordion"
					onChange={(e) => setLastName(e.target.value)}
				/>
			</div>
			<div className="grid grid-cols-2 gap-4">
				<OutlinedInput
					id="email"
					label="Email"
					type="email"
					value={user.email}
					labelBg="bg-accordion"
					disabled
				/>
				<MaterialPhoneInput value={phone} onChange={(v) => setPhone(v ?? "")} />
			</div>
			<div className="w-full flex items-center">
				<button
					type="button"
					onClick={handleSave}
					disabled={
						loading || !firstName.trim() || !lastName.trim() || !isDirty
					}
					className="cursor-pointer w-full text-center bg-primary hover:bg-primary-hover border border-primary-hover text-white text-base font-bold py-3 transition-all flex justify-center items-center gap-2 disabled:opacity-50 shadow-sm"
				>
					{loading ? (
						<Loader size={18} className="animate-spin" />
					) : (
						<Save size={18} />
					)}
					Salvar Alterações
				</button>
			</div>
		</div>
	);
}
