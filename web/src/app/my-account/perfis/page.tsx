"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Pencil, Trash2, Loader, X } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

interface SubProfile {
  id: string;
  name: string;
  avatarColor: string;
  createdAt: string;
}

const COLORS = [
  "#2C9ED5", "#E04F5D", "#6C5CE7", "#00B894",
  "#FDCB6E", "#E17055", "#0984E3", "#A29BFE",
  "#FD79A8", "#55EFC4",
];

export default function PerfisPage() {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<SubProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SubProfile | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);

  const fetchProfiles = async () => {
    try {
      const res = await fetch("/api/profiles");
      if (!res.ok) throw new Error("Erro ao carregar perfis");
      const data = await res.json();
      if (Array.isArray(data)) {
        setProfiles(data);
      }
    } catch {
      toast("Erro ao carregar perfis");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), avatarColor: color }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast("Perfil criado com sucesso");
      setName("");
      setShowForm(false);
      fetchProfiles();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao criar perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editing || !name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/profiles/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), avatarColor: color }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao atualizar perfil");
      }
      toast("Perfil atualizado");
      setEditing(null);
      setName("");
      setShowForm(false);
      fetchProfiles();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao atualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem a certeza que deseja eliminar este perfil?")) return;
    try {
      const res = await fetch(`/api/profiles/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao eliminar perfil");
      toast("Perfil eliminado");
      fetchProfiles();
    } catch {
      toast("Erro ao eliminar perfil");
    }
  };

  const openEdit = (p: SubProfile) => {
    setEditing(p);
    setName(p.name);
    setColor(p.avatarColor);
    setShowForm(true);
  };

  const openCreate = () => {
    setEditing(null);
    setName("");
    setColor(profiles.length < COLORS.length ? COLORS[profiles.length] : COLORS[0]);
    setShowForm(true);
  };

  const atMaxProfiles = profiles.length >= 5;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-text">Sub-perfis</h1>
          <p className="text-text-muted mt-1">Gere os perfis da sua conta</p>
        </div>
        <button
          onClick={openCreate}
          disabled={atMaxProfiles}
          className="bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50"
          title={atMaxProfiles ? "Máximo de 5 perfis atingido" : undefined}
        >
          <Plus size={16} />
          Novo Perfil
        </button>
      </div>

      {showForm && (
        <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text">
              {editing ? "Editar Perfil" : "Novo Perfil"}
            </h2>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="text-text-muted hover:text-text">
              <X size={20} />
            </button>
          </div>
          <div>
            <label className="text-sm text-text-muted mb-1 block">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              className="w-full h-11 px-4 bg-bg border border-border rounded-lg text-text text-sm focus:outline-none focus:border-primary transition-colors"
              placeholder="Nome do perfil"
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm text-text-muted mb-2 block">Cor</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === c ? "ring-2 ring-offset-2 ring-offset-surface" : ""
                  }`}
                  style={{ backgroundColor: c, ["--tw-ring-color" as string]: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0"
              style={{ backgroundColor: color }}
            >
              {name ? name[0].toUpperCase() : "?"}
            </div>
            <button
              onClick={editing ? handleUpdate : handleCreate}
              disabled={!name.trim() || saving}
              className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {saving && <Loader size={16} className="animate-spin" />}
              {editing ? "Guardar" : "Criar"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-text-muted">A carregar...</div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <Users size={48} className="mx-auto mb-4 opacity-50" />
          <p>Ainda não criou nenhum sub-perfil</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((p) => (
            <div
              key={p.id}
              className="bg-surface border border-border rounded-xl p-5 flex items-center gap-4"
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0"
                style={{ backgroundColor: p.avatarColor }}
              >
                {(p.name?.[0] || "?").toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-text truncate">{p.name}</h3>
                <p className="text-xs text-text-muted">
                  Criado {p.createdAt ? new Date(p.createdAt).toLocaleDateString("pt-PT") : ""}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(p)}
                  className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-all"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="p-2 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
