"use client";

import { useState } from "react";
import { Button } from "@/packages/ui";
import { Input } from "@/packages/ui";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Key, Loader2, Copy, Check } from "lucide-react";

export default function AdminGeneratePage() {
  const [type, setType] = useState<"TRIAL" | "STANDARD">("STANDARD");
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar licencas");
      setGenerated(data.licenses.map((l: { key: string }) => l.key));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao gerar licencas"
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Key className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-display font-bold text-white">
          Gerar Licencas
        </h1>
      </div>

      <div className="max-w-xl">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <Alert variant="error">{error}</Alert>}
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">
                Tipo de Licenca
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "TRIAL" | "STANDARD")}
                className="h-12 w-full rounded-lg border border-border bg-surface px-4 py-2 text-sm text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 transition-colors"
              >
                <option value="TRIAL">Trial (Gratis)</option>
                <option value="STANDARD">Standard (Pago)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">
                Duracao (dias)
              </label>
              <Input
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(parseInt(e.target.value))}
                min={1}
                max={3650}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">
                Quantidade
              </label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                min={1}
                max={100}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">
                Nome do Lote (opcional)
              </label>
              <Input
                type="text"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="Ex: Julho 2026"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  A gerar...
                </>
              ) : (
                "Gerar Licencas"
              )}
            </Button>
          </form>
        </Card>
      </div>

      {generated.length > 0 && (
        <div className="mt-8">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">
                Licencas Geradas ({generated.length})
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(generated.join("\n"))
                  }
                >
                  <Copy className="w-4 h-4" />
                  Copiar Todas
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setGenerated([])}
                >
                  Limpar
                </Button>
              </div>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {generated.map((key) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 bg-bg rounded-lg border border-border"
                >
                  <code className="text-primary font-mono text-sm">{key}</code>
                  <button
                    onClick={() => copyToClipboard(key)}
                    className="text-text-muted hover:text-white transition-colors p-1"
                  >
                    {copied === key ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
