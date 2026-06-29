import { useState } from "react";
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole } from "../../hooks";
import { useToast } from "../../hooks/useToast";
import { Button, Input, Loader, Modal } from "../../ui";
import * as Lucide from "lucide-react";

interface RoleManagementProps {
  onClose?: () => void;
}

type Mode = "list" | "form";

const FIELD_TYPES = [
  { value: "text", label: "Texto" },
  { value: "number", label: "Número" },
  { value: "select", label: "Seleção" },
  { value: "boolean", label: "Sim/Não" },
  { value: "date", label: "Data" },
];

interface FormField {
  label: string;
  field_type: string;
  required: boolean;
  options: string;
}

interface FormState {
  id?: number;
  name: string;
  description: string;
  fields: FormField[];
}

const emptyForm: FormState = {
  name: "",
  description: "",
  fields: [],
};

export default function RoleManagement({ onClose }: RoleManagementProps) {
  const { data: roles, isLoading } = useRoles();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const { toast } = useToast();

  const [mode, setMode] = useState<Mode>("list");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function startCreate() {
    setForm(emptyForm);
    setMode("form");
  }

  function startEdit(role: { id: number; name: string; description: string | null; fields: { label: string; field_type: string; required: boolean; options: string[] | null }[] }) {
    setForm({
      id: role.id,
      name: role.name,
      description: role.description ?? "",
      fields: role.fields.map((f) => ({
        label: f.label,
        field_type: f.field_type,
        required: f.required,
        options: f.options?.join(", ") ?? "",
      })),
    });
    setMode("form");
  }

  function goBack() {
    setMode("list");
  }

  function addField() {
    setForm((prev) => ({
      ...prev,
      fields: [...prev.fields, { label: "", field_type: "text", required: false, options: "" }],
    }));
  }

  function removeField(idx: number) {
    setForm((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== idx),
    }));
  }

  function updateField(idx: number, key: string, value: unknown) {
    setForm((prev) => {
      const fields = [...prev.fields];
      fields[idx] = { ...fields[idx], [key]: value };
      return { ...prev, fields };
    });
  }

  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSave() {
    const fields = form.fields.map((f) => ({
      label: f.label,
      field_type: f.field_type,
      required: f.required,
      options: f.options ? f.options.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
    }));
    setSaveError(null);
    try {
      if (form.id) {
        await updateRole.mutateAsync({ id: form.id, name: form.name, description: form.description || undefined, fields });
      } else {
        await createRole.mutateAsync({ name: form.name, description: form.description || undefined, fields });
      }
      setMode("list");
    } catch (err: unknown) {
      const msg = (err as { detail?: string })?.detail || "Erro ao salvar cargo";
      setSaveError(msg);
      toast(msg, "error");
    }
  }

  async function handleDelete() {
    if (!form.id) return;
    setDeleteError(null);
    try {
      await deleteRole.mutateAsync(form.id);
      setDeleteConfirm(false);
      setMode("list");
      toast("Cargo eliminado com sucesso", "success");
    } catch (err: unknown) {
      const msg = (err as { detail?: string })?.detail || "Erro ao eliminar cargo";
      setDeleteError(msg);
      toast(msg, "error");
    }
  }

  if (mode === "form") {
    return (
      <div className="flex-1 h-full flex flex-col relative overflow-hidden">
        <header className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Lucide.FolderTree size={22} className="text-primary" />
            <h2 className="text-xl font-bold text-text">
              {form.id ? "Editar Cargo" : "Novo Cargo"}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="secondary"
              icon={<Lucide.ArrowLeft size={14} />}
              onClick={goBack}
            >
              Voltar
            </Button>
            {form.id && (
              <Button
                size="sm"
                variant="danger"
                icon={<Lucide.Trash size={14} />}
                onClick={() => { setDeleteConfirm(true); setDeleteError(null); }}
              >
                Eliminar
              </Button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto mt-6 flex justify-center">
          <div className="w-full max-w-xl space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text">Nome *</label>
              <Input
                placeholder="Ex: Residente, Visitante, Trabalhador"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text">Descrição</label>
              <Input
                placeholder="Descrição opcional do cargo"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-text">Campos Personalizados</label>
                <Button size="sm" variant="secondary" icon={<Lucide.Plus size={12} />} onClick={addField}>
                  Adicionar Campo
                </Button>
              </div>
              <div className="space-y-3">
                {form.fields.map((field, idx) => (
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

            <div className="flex flex-col items-end gap-2 pt-4">
              {saveError && (
                <p className="text-xs text-red-400 text-right w-full">{saveError}</p>
              )}
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={goBack}>
                  <Lucide.ArrowLeft size={16} />
                  Voltar
                </Button>
                <Button onClick={handleSave} disabled={createRole.isPending || updateRole.isPending}>
                  {createRole.isPending || updateRole.isPending ? (
                    <>
                      <Lucide.Loader2 size={16} className="animate-spin" />
                      A salvar...
                    </>
                  ) : (
                    form.id ? "Salvar" : "Criar"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Modal
          open={deleteConfirm}
          onClose={() => setDeleteConfirm(false)}
          className="max-w-md bg-surface border border-border rounded-xl p-6"
        >
          <h3 className="text-lg font-bold text-text mb-4">Confirmar remoção</h3>
          {deleteError ? (
            <>
              <div className="bg-red-400/10 border border-red-400/30 text-red-400 text-sm rounded-lg p-3 mb-4">
                {deleteError}
              </div>
              <div className="flex justify-end">
                <Button variant="secondary" onClick={() => { setDeleteConfirm(false); setDeleteError(null); }}>
                  OK
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-text-muted mb-6">Tem a certeza que deseja remover este cargo?</p>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setDeleteConfirm(false)}>Cancelar</Button>
                <Button variant="danger" onClick={handleDelete}>Remover</Button>
              </div>
            </>
          )}
        </Modal>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full flex flex-col relative overflow-hidden">
      <header className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Lucide.FolderTree size={22} className="text-primary" />
          <h2 className="text-xl font-bold text-text">Gerenciar Cargos</h2>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" icon={<Lucide.Plus size={14} />} onClick={startCreate}>
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
    </div>
  );
}
