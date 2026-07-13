"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminGeneratePage() {
  const router = useRouter();
  const [type, setType] = useState<"TRIAL" | "STANDARD">("STANDARD");
  const [durationDays, setDurationDays] = useState(30);
  const [quantity, setQuantity] = useState(1);
  const [batchName, setBatchName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState<string[]>([]);

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

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao gerar licenças");
      }

      setGenerated(data.licenses.map((l: { key: string }) => l.key));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao gerar licenças"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-white mb-8">
        Gerar Licenças
      </h1>

      <div className="max-w-xl">
        <form
          onSubmit={handleSubmit}
          className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 space-y-6"
        >
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Tipo de Licença
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "TRIAL" | "STANDARD")}
              className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:border-[#22D3EE] transition-colors"
            >
              <option value="TRIAL">Trial (Grátis)</option>
              <option value="STANDARD">Standard (Pago)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Duração (dias)
            </label>
            <input
              type="number"
              value={durationDays}
              onChange={(e) => setDurationDays(parseInt(e.target.value))}
              min={1}
              max={3650}
              className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:border-[#22D3EE] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Quantidade
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              min={1}
              max={100}
              className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:border-[#22D3EE] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Nome do Lote (opcional)
            </label>
            <input
              type="text"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#22D3EE] transition-colors"
              placeholder="Ex: Julho 2026"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#22D3EE] text-black py-3 rounded-lg font-semibold hover:brightness-110 transition-all disabled:opacity-50"
          >
            {loading ? "A gerar..." : "Gerar Licenças"}
          </button>
        </form>
      </div>

      {generated.length > 0 && (
        <div className="mt-8 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          <h2 className="text-lg font-semibold text-white mb-4">
            Licenças Geradas ({generated.length})
          </h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {generated.map((key) => (
              <div
                key={key}
                className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg"
              >
                <code className="text-[#22D3EE] font-mono text-sm">{key}</code>
                <button
                  onClick={() => navigator.clipboard.writeText(key)}
                  className="text-gray-400 hover:text-white text-sm"
                >
                  Copiar
                </button>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-4">
            <button
              onClick={() => {
                navigator.clipboard.writeText(generated.join("\n"));
              }}
              className="px-4 py-2 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.05] transition-all text-sm"
            >
              Copiar Todas
            </button>
            <button
              onClick={() => setGenerated([])}
              className="px-4 py-2 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.05] transition-all text-sm"
            >
              Limpar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
