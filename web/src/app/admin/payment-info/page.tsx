"use client";

import { useState, useEffect } from "react";
import { Save, Loader, Landmark } from "lucide-react";

interface PaymentInfo {
  id: string;
  iban: string;
  accountName: string;
  bankName: string | null;
}

export default function AdminPaymentInfoPage() {
  const [info, setInfo] = useState<PaymentInfo | null>(null);
  const [iban, setIban] = useState("");
  const [accountName, setAccountName] = useState("");
  const [bankName, setBankName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/payment-info")
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setInfo(data);
          setIban(data.iban);
          setAccountName(data.accountName);
          setBankName(data.bankName || "");
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    if (!iban || !accountName) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/payment-info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iban, accountName, bankName }),
      });
      if (res.ok) {
        const data = await res.json();
        setInfo(data);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-[#9dabb9]">A carregar...</p>;

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-display font-bold text-white">Dados Bancários</h1>

      <div className="bg-[#1c2127] border border-[#3b4754] rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
            <Landmark size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Dados para Transferência</h2>
            <p className="text-xs text-[#9dabb9]">IBAN e titular da conta para recebimento de pagamentos</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#9dabb9] mb-1 block">IBAN</label>
            <input
              type="text" value={iban} onChange={(e) => setIban(e.target.value)}
              placeholder="PT50 0002 0000 0000 0000 0000 0"
              className="w-full h-10 px-3 bg-[#202634] border border-[#3b4754] rounded-lg text-white text-sm font-mono focus:outline-none focus:border-[#2C9ED5]"
            />
          </div>
          <div>
            <label className="text-xs text-[#9dabb9] mb-1 block">Nome da Conta</label>
            <input
              type="text" value={accountName} onChange={(e) => setAccountName(e.target.value)}
              placeholder="Empresa Lda"
              className="w-full h-10 px-3 bg-[#202634] border border-[#3b4754] rounded-lg text-white text-sm focus:outline-none focus:border-[#2C9ED5]"
            />
          </div>
          <div>
            <label className="text-xs text-[#9dabb9] mb-1 block">Banco (opcional)</label>
            <input
              type="text" value={bankName} onChange={(e) => setBankName(e.target.value)}
              placeholder="Millennium BCP"
              className="w-full h-10 px-3 bg-[#202634] border border-[#3b4754] rounded-lg text-white text-sm focus:outline-none focus:border-[#2C9ED5]"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!iban || !accountName || saving}
          className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-bold hover:brightness-110 flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
          {saved ? "Guardado!" : "Guardar"}
        </button>
      </div>
    </div>
  );
}
