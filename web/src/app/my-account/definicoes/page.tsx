"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Settings, Save, Loader } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { FloatingLabelInput } from "@/components/FloatingLabelInput";

export default function DefinicoesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) {
          setFirstName(data.user.firstName || "");
          setLastName(data.user.lastName || "");
          setEmail(data.user.email || "");
          setPhone(data.user.phone || "");
        }
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

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
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim(), phone: phone || null }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao guardar");
      }
      toast("Definições guardadas com sucesso");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao guardar");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="space-y-8 max-w-xl">
        <div>
          <h1 className="text-3xl font-display font-bold text-text">Definições</h1>
          <p className="text-text-muted mt-1">Gere os dados da sua conta</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="text-center py-8 text-text-muted">A carregar...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-xl">
      <div>
        <h1 className="text-3xl font-display font-bold text-text">Definições</h1>
        <p className="text-text-muted mt-1">Gere os dados da sua conta</p>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 space-y-5">
        <h2 className="text-lg font-semibold text-text flex items-center gap-2">
          <Settings size={18} className="text-primary" />
          Dados Pessoais
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <FloatingLabelInput
            id="firstName"
            label="Primeiro Nome"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <FloatingLabelInput
            id="lastName"
            label="Último Nome"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
        <FloatingLabelInput
          id="email"
          label="Email"
          type="email"
          value={email}
          disabled
        />
        <FloatingLabelInput
          id="phone"
          label="Telemóvel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <button
          onClick={handleSave}
          disabled={loading || !firstName.trim() || !lastName.trim()}
          className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
          Guardar Alterações
        </button>
      </div>
    </div>
  );
}
