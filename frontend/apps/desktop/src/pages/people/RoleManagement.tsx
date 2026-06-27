import { useState } from "react";
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole } from "../../hooks";
import { Button, Input, Loader, Modal } from "../../ui";
import * as Lucide from "lucide-react";

interface RoleManagementProps {
  onClose?: () => void;
}

const FIELD_TYPES = [
  { value: "text", label: "Texto" },
  { value: "number", label: "Número" },
  { value: "select", label: "Seleção" },
  { value: "boolean", label: "Sim/Não" },
  { value: "date", label: "Data" },
];

export default function RoleManagement({ onClose }: RoleManagementProps) {
  const { data: roles, isLoading } = useRoles();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();

  const [editing, setEditing] = useState<{ id?: number; name: string; description: string; fields: { label: string; field_type: string; required: boolean; options: string }[] } | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleSave = async () => {
    if (!editing) return;
    const fields = editing.fields.map((f) => ({
      label: f.label,
      field_type: f.field_type,
      required: f.required,
      options: f.options ? f.options.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
    }));
    if (editing.id) {
      await updateRole.mutateAsync({ id: editing.id, name: editing.name, description: editing.description || undefined, fields });
    } else {
      await createRole.mutateAsync({ name: editing.name, description: editing.description || undefined, fields });
    }
    setEditing(null);
  };

  const startEdit = (role?: { id: number; name: string; description: string | null; fields: { label: string; field_type: string; required: boolean; options: string[] | null }[] }) => {
    setEditing({
      id: role?.id,
      name: role?.name ?? "",
      description: role?.description ?? "",
      fields: (role?.fields ?? []).map((f) => ({
        label: f.label,
        field_type: f.field_type,
        required: f.required,
        options: f.options?.join(", ") ?? "",
      })),
    });
  };

  const addField = () => {
    setEditing((prev) => prev ? {
      ...prev,
      fields: [...prev.fields, { label: "", field_type: "text", required: false, options: "" }],
    } : null);
  };

  const removeField = (idx: number) => {
    setEditing((prev) => prev ? {
      ...prev,
      fields: prev.fields.filter((_, i) => i !== idx),
    } : null);
  };

  const updateField = (idx: number, key: string, value: unknown) => {
    setEditing((prev) => {
      if (!prev) return null;
      const fields = [...prev.fields];
      fields[idx] = { ...fields[idx], [key]: value };
      return { ...prev, fields };
    });
  };

  return (
    <div className="flex-1 h-full flex flex-col relative overflow-hidden">
      <header className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Lucide.FolderTree size={22} className="text-primary" />
          <h2 className="text-xl font-bold text-text">Gerenciar Cargos</h2>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" icon={<Lucide.Plus size={14} />} onClick={() => startEdit()}>
            Novo Cargo
          </Button>
          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-gray-400 hover:text-white transition-all duration-150"
            >
              <Lucide.X size={16} strokeWidth={2} />
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto mt-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader w={50} />
          </div>
        ) : roles && roles.length > 0 ? (
          <div className="space-y-3">
            {roles.map((role) => (
              <div
                key={role.id}
                className="flex items-center justify-between bg-surface border border-border rounded-xl px-5 py-4"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-text">{role.name}</h3>
                  {role.description && (
                    <p className="text-xs text-text-muted mt-0.5">{role.description}</p>
                  )}
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {role.fields.map((f) => (
                      <span key={f.id} className="px-2 py-0.5 rounded bg-white/[0.05] text-xs text-text-muted">
                        {f.label} ({f.field_type}{f.required ? ", obrigatório" : ""})
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 ml-4 shrink-0">
                  <button
                    onClick={() => startEdit(role)}
                    className="p-2 rounded-lg hover:bg-white/[0.06] text-text-muted hover:text-primary transition-colors"
                  >
                    <Lucide.Pencil size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteId(role.id)}
                    className="p-2 rounded-lg hover:bg-white/[0.06] text-text-muted hover:text-red-500 transition-colors"
                  >
                    <Lucide.Trash size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full flex justify-center items-center flex-col text-center gap-3 mt-16">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center">
              <Lucide.FolderTree size={28} className="text-text-muted" />
            </div>
            <div className="flex flex-col gap-1 max-w-md">
              <h3 className="text-text font-semibold text-base">Nenhum cargo criado</h3>
              <p className="text-text-muted text-sm leading-relaxed">
                Crie cargos para definir tipos de pessoas na plataforma
              </p>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        className="max-w-2xl w-full mx-4 bg-surface border border-border rounded-xl p-6 max-h-[85vh] overflow-y-auto"
      >
        {editing && (
          <>
            <h3 className="text-lg font-bold text-text mb-5">
              {editing.id ? "Editar Cargo" : "Novo Cargo"}
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text">Nome *</label>
                <Input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="Ex: Residente, Visitante, Trabalhador"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text">Descrição</label>
                <Input
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  placeholder="Descrição opcional do cargo"
                />
              </div>

              <div className="border-t border-white/[0.06] pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-text">Campos Personalizados</label>
                  <Button size="sm" variant="secondary" icon={<Lucide.Plus size={12} />} onClick={addField}>
                    Adicionar Campo
                  </Button>
                </div>
                <div className="space-y-3">
                  {editing.fields.map((field, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-white/[0.03] rounded-lg p-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Input
                              placeholder="Nome do campo"
                              value={field.label}
                              onChange={(e) => updateField(idx, "label", e.target.value)}
                            />
                          </div>
                          <select
                            value={field.field_type}
                            onChange={(e) => updateField(idx, "field_type", e.target.value)}
                            className="h-12 rounded-lg border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:border-primary"
                          >
                            {FIELD_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                        </div>
                        {field.field_type === "select" && (
                          <Input
                            placeholder="Opções separadas por vírgula"
                            value={field.options}
                            onChange={(e) => updateField(idx, "options", e.target.value)}
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <label className="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(idx, "required", e.target.checked)}
                            className="w-3.5 h-3.5 accent-primary"
                          />
                          Obrigatório
                        </label>
                        <button
                          onClick={() => removeField(idx)}
                          className="p-1.5 rounded-lg hover:bg-white/[0.06] text-text-muted hover:text-red-500 transition-colors"
                        >
                          <Lucide.Trash size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
                <Button variant="secondary" onClick={() => setEditing(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave}>
                  {editing.id ? "Salvar" : "Criar"}
                </Button>
              </div>
            </div>
          </>
        )}
      </Modal>

      <Modal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        className="max-w-md bg-surface border border-border rounded-xl p-6"
      >
        <h3 className="text-lg font-bold text-text mb-4">Confirmar remoção</h3>
        <p className="text-text-muted mb-6">Tem a certeza que deseja remover este cargo?</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button variant="danger" onClick={async () => {
            if (deleteId) await deleteRole.mutateAsync(deleteId);
            setDeleteId(null);
          }}>Remover</Button>
        </div>
      </Modal>
    </div>
  );
}
