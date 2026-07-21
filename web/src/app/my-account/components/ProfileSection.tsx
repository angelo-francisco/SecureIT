"use client";

import { useState } from "react";
import { Save, Loader } from "lucide-react";
import { useToast } from "@/packages/ui";
import { OutlinedInput } from "@/components/OutlinedInput";
import { MaterialPhoneInput } from "@/components/MaterialPhoneInput";

interface ProfileSectionProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

export function ProfileSection({ user }: ProfileSectionProps) {
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
        const data = (await res.json()) as any;
        throw new Error(data.error || "Erro ao guardar");
      }
      toast("Definições guardadas com sucesso");
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
        <MaterialPhoneInput
          value={phone}
          onChange={(v) => setPhone(v ?? "")}
        />
      </div>
      <div className="w-full flex items-center">
        <button
          onClick={handleSave}
          disabled={loading || !firstName.trim() || !lastName.trim() || !isDirty}
          className="cursor-pointer w-full text-center bg-primary px-4 py-2 text-white text-lg font-bold hover:brightness-110 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
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
