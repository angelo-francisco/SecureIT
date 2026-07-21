"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  Loader,
  Lock,
  X
} from "lucide-react";
import { OutlinedInput } from "@/components/OutlinedInput";
import { Modal, PinInput, useToast } from "@/packages/ui";

export interface SubProfile {
  id: string;
  name: string;
  avatarColor: string;
  isDefault: boolean;
  hasPin: boolean;
  createdAt: string;
}

const COLORS = [
  "#2C9ED5",
  "#E04F5D",
  "#6C5CE7",
  "#00B894",
  "#FDCB6E",
  "#E17055",
  "#0984E3",
  "#A29BFE",
  "#FD79A8",
  "#55EFC4",
];

export function ProfilesSection() {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<SubProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SubProfile | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [pin, setPin] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profiles");
      if (res.ok) {
        const d = (await res.json()) as any;
        if (Array.isArray(d)) setProfiles(d);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setPin("");
    setColor(
      profiles.length < COLORS.length ? COLORS[profiles.length] : COLORS[0]
    );
    setModalOpen(true);
  };

  const openEdit = (p: SubProfile) => {
    setEditing(p);
    setName(p.name);
    setColor(p.avatarColor);
    setPin("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setName("");
    setPin("");
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          avatarColor: color,
          pin: pin || undefined,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as any;
        throw new Error(data.error);
      }
      toast("Perfil criado com sucesso");
      closeModal();
      fetchData();
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
        body: JSON.stringify({
          name: name.trim(),
          avatarColor: color,
          pin: pin || undefined,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as any;
        throw new Error(data.error || "Erro ao atualizar perfil");
      }
      toast("Perfil atualizado");
      closeModal();
      fetchData();
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Erro ao atualizar perfil"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem a certeza que deseja eliminar este perfil?")) return;
    try {
      const res = await fetch(`/api/profiles/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json()) as any;
        throw new Error(data.error);
      }
      toast("Perfil eliminado");
      fetchData();
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Erro ao eliminar perfil"
      );
    }
  };

  return (
    <>
      <div className="flex gap-4 overflow-x-auto scrollbar-thin">
        <button
          onClick={openCreate}
          className="shrink-0 group animate-tile"
        >
          <div className="w-24 h-24 bg-surface-hover border-2 border-dashed border-border flex items-center justify-center group-hover:border-primary group-hover:bg-primary/5 transition-all">
            <Plus size={28} className="text-text-muted group-hover:text-primary transition-colors" />
          </div>
          <span className="block text-center text-lg text-text-muted mt-2 group-hover:text-primary transition-colors">
            Adicionar
          </span>
        </button>

        {profiles.map((p, i) => (
          <button
            key={p.id}
            onClick={() => openEdit(p)}
            className="shrink-0 group relative animate-tile"
            style={{ animationDelay: `${(i + 1) * 60}ms` }}
          >
            <div
              className="w-24 h-24 flex items-center justify-center text-white text-2xl font-bold transition-transform group-hover:scale-105"
              style={{ backgroundColor: p.avatarColor }}
            >
              {(p.name?.[0] || "?").toUpperCase()}
            </div>
            <span className="flex capitalize items-center gap-1 justify-center text-center text-lg text-text-muted mt-2 truncate w-24">
              {p.name} {p.isDefault && <Lock size={14} className="text-text-muted" />}
            </span>
          </button>
        ))}
      </div>

      {profiles.length > 0 && (
        <div className="flex gap-2 flex-wrap mt-1">
          {profiles.filter(p => !p.isDefault).length > 0 && (
            <span className="text-[11px] text-text-muted/60">
              Clique num perfil para editar
            </span>
          )}
        </div>
      )}

      <Modal open={modalOpen} onClose={closeModal}>
        <div className="bg-surface backdrop-blur-sm p-8 w-full max-w-md space-y-4 border">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold text-text">
              {editing ? "Editar Perfil" : "Novo Perfil"}
            </h3>
            {editing && !editing.isDefault && (
              <button
                onClick={() => {
                  if (editing) {
                    closeModal();
                    handleDelete(editing.id);
                  }
                }}
                className="px-3 py-2.5 rounded-lg text-sm font-medium text-error hover:bg-error/10 transition-all"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          <div className="pt-3">
            <OutlinedInput
              id="name"
              label="Nome"
              className=""
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-lg text-text-muted mb-2 block">
              Cor
            </label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-sm transition-all duration-200 ${color === c
                    ? "ring-2 ring-offset-2 ring-offset-surface scale-110"
                    : "hover:scale-110"
                    }`}
                  style={{
                    backgroundColor: c,
                    ["--tw-ring-color" as string]: c,
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-lg text-text-muted mb-3 block">
              Código de Acesso
            </label>
            <PinInput
              value={pin}
              onChange={setPin}
              length={4}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <div className="flex-1 flex w-full gap-2">
              <button
                onClick={closeModal}
                className="px-4 py-2.5 border text-sm font-medium text-text-muted hover:text-text hover:bg-surface-hover transition-all"
              >
                <X />
              </button>
              <button
                onClick={editing ? handleUpdate : handleCreate}
                disabled={!name.trim() || saving}
                className="w-full bg-primary text-center text-white px-6 py-2.5 text-sm font-bold hover:brightness-110 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {saving && (
                  <Loader size={14} className="animate-spin" />
                )}
                {editing ? "Salvar Alterações" : "Criar Perfil"}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
