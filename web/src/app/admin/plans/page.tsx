"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Loader, X, CreditCard } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: string;
  currency: string;
  durationDays: number;
  isActive: boolean;
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/admin/plans");
      if (!res.ok) throw new Error("Erro ao carregar planos");
      const data = await res.json();
      if (Array.isArray(data)) setPlans(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  const handleSave = async () => {
    if (!name || !price || !durationDays) return;
    setSaving(true);
    try {
      const url = "/api/admin/plans";
      const method = editing ? "PUT" : "POST";
      const body = editing
        ? { id: editing.id, name, description, price, durationDays: Number(durationDays) }
        : { name, description, price, durationDays: Number(durationDays) };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Erro ao guardar plano");
      setShowForm(false);
      setEditing(null);
      setName("");
      setDescription("");
      setPrice("");
      setDurationDays("");
      fetchPlans();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (plan: Plan) => {
    await fetch("/api/admin/plans", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: plan.id, isActive: !plan.isActive }),
    });
    fetchPlans();
  };

  const openEdit = (p: Plan) => {
    setEditing(p);
    setName(p.name);
    setDescription(p.description || "");
    setPrice(p.price);
    setDurationDays(String(p.durationDays));
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-white">Planos</h1>
        <button
          onClick={() => { setEditing(null); setName(""); setDescription(""); setPrice(""); setDurationDays(""); setShowForm(true); }}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:brightness-110 flex items-center gap-2"
        >
          <Plus size={16} /> Novo Plano
        </button>
      </div>

      {showForm && (
        <div className="bg-[#1c2127] border border-[#3b4754] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              {editing ? "Editar Plano" : "Novo Plano"}
            </h2>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="text-[#9dabb9] hover:text-white">
              <X size={20} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#9dabb9] mb-1 block">Nome</label>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3 bg-[#202634] border border-[#3b4754] rounded-lg text-white text-sm focus:outline-none focus:border-[#2C9ED5]"
              />
            </div>
            <div>
              <label className="text-xs text-[#9dabb9] mb-1 block">Preço (€)</label>
              <input
                type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)}
                className="w-full h-10 px-3 bg-[#202634] border border-[#3b4754] rounded-lg text-white text-sm focus:outline-none focus:border-[#2C9ED5]"
              />
            </div>
            <div>
              <label className="text-xs text-[#9dabb9] mb-1 block">Duração (dias)</label>
              <input
                type="number" value={durationDays} onChange={(e) => setDurationDays(e.target.value)}
                className="w-full h-10 px-3 bg-[#202634] border border-[#3b4754] rounded-lg text-white text-sm focus:outline-none focus:border-[#2C9ED5]"
              />
            </div>
            <div>
              <label className="text-xs text-[#9dabb9] mb-1 block">Descrição</label>
              <input
                type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                className="w-full h-10 px-3 bg-[#202634] border border-[#3b4754] rounded-lg text-white text-sm focus:outline-none focus:border-[#2C9ED5]"
              />
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={!name || !price || !durationDays || saving}
            className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-bold hover:brightness-110 flex items-center gap-2 disabled:opacity-50"
          >
            {saving && <Loader size={16} className="animate-spin" />}
            {editing ? "Guardar" : "Criar"}
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-[#9dabb9]">A carregar...</p>
      ) : plans.length === 0 ? (
        <div className="text-center py-16 text-[#9dabb9]">
          <CreditCard size={48} className="mx-auto mb-4 opacity-50" />
          <p>Nenhum plano criado</p>
        </div>
      ) : (
        <div className="bg-[#1c2127] border border-[#3b4754] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#3b4754]">
                <th className="text-left px-6 py-3 text-xs font-medium text-[#9dabb9] uppercase">Nome</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-[#9dabb9] uppercase">Preço</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-[#9dabb9] uppercase">Duração</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-[#9dabb9] uppercase">Estado</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-[#9dabb9] uppercase">Ações</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.id} className="border-b border-[#3b4754] last:border-0">
                  <td className="px-6 py-4">
                    <p className="text-white font-medium">{p.name}</p>
                    {p.description && <p className="text-xs text-[#9dabb9]">{p.description}</p>}
                  </td>
                  <td className="px-6 py-4 text-white">€{Number(p.price).toFixed(2)}</td>
                  <td className="px-6 py-4 text-white">{p.durationDays} dias</td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleActive(p)} className={`px-2 py-1 rounded text-xs font-medium ${p.isActive ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                      {p.isActive ? "Ativo" : "Inativo"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEdit(p)} className="p-1.5 text-[#9dabb9] hover:text-white rounded hover:bg-[#283039]">
                      <Pencil size={14} />
                    </button>
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
