import { useState, useMemo, useEffect, type FormEvent } from "react";
import { usePerson, useUpdatePerson, useDeletePerson, useRoles } from "../../hooks";
import { usePersonViewStore } from "../../stores";
import { usePanelNavigate } from "../../hooks/usePanelNavigate";
import { useToast } from "../../hooks/useToast";
import { Button, Input, Toggle, Modal, Loader } from "@/packages/ui";
import { PhotoCapture, usePhotoCapture } from "../../ui";
import { getApiBaseUrl } from "../../api-client/client";
import * as Lucide from "lucide-react";

interface PersonViewProps {
  onClose?: () => void;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  photo?: string;
}

export default function PersonView({ onClose }: PersonViewProps) {
  const personId = usePersonViewStore((s) => s.personId);
  const { data: person, isLoading } = usePerson(personId);
  const updatePerson = useUpdatePerson();
  const deletePerson = useDeletePerson();
  const { data: allRoles } = useRoles();
  const panelNavigate = usePanelNavigate();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [banned, setBanned] = useState(false);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [roleFields, setRoleFields] = useState<Record<string, Record<string, unknown>>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const { photo, showCapture, startCapture, handleCapture, setPhoto } = usePhotoCapture();

  // Populate data when person is loaded
  useEffect(() => {
    if (person) {
      setFirstName(person.first_name);
      setLastName(person.last_name);
      setBanned(person.banned);
      setPhoto(""); // Reset capture preview
      if (person.roles) {
        setSelectedRoleIds(person.roles.map((r) => r.role_id));
        const initialFields: Record<string, Record<string, unknown>> = {};
        person.roles.forEach((r) => {
          initialFields[String(r.role_id)] = r.field_values || {};
        });
        setRoleFields(initialFields);
      }
    }
  }, [person, setPhoto]);

  const filteredRoles = useMemo(() => {
    if (!allRoles) return [];
    if (!searchQuery) return allRoles;
    const q = searchQuery.toLowerCase();
    return allRoles.filter(
      (r) => r.name.toLowerCase().includes(q) || (r.description && r.description.toLowerCase().includes(q))
    );
  }, [allRoles, searchQuery]);

  const selectedRoles = useMemo(() => {
    if (!allRoles) return [];
    return allRoles.filter((r) => selectedRoleIds.includes(r.id));
  }, [allRoles, selectedRoleIds]);

  const toggleRole = (id: number) => {
    setSelectedRoleIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
    setRoleFields((prev) => {
      const copy = { ...prev };
      if (selectedRoleIds.includes(id)) {
        delete copy[String(id)];
      }
      return copy;
    });
  };

  const updateField = (roleId: number, label: string, value: unknown) => {
    setRoleFields((prev) => ({
      ...prev,
      [String(roleId)]: { ...(prev[String(roleId)] || {}), [label]: value },
    }));
  };

  async function handleDelete() {
    if (!person) return;
    try {
      await deletePerson.mutateAsync(person.id);
      toast("Pessoa removida com sucesso", "success");
      setDeleteConfirm(false);
      usePersonViewStore.getState().setPersonId(null);
      panelNavigate?.("people");
    } catch (err: unknown) {
      const msg = (err as Error)?.message || "Erro ao remover pessoa";
      toast(msg, "error");
    }
  }

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!firstName.trim()) errs.firstName = "O primeiro nome é obrigatório";
    if (!lastName.trim()) errs.lastName = "O sobrenome é obrigatório";
    return errs;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!person) return;
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const data = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      photo_base64: photo || "", // send empty string if photo wasn't recaptured
      banned: banned,
      roles: selectedRoles.map((role) => ({
        role_id: role.id,
        field_values: roleFields[String(role.id)] || {},
      })),
    };

    try {
      await updatePerson.mutateAsync({ id: person.id, data });
      toast("Dados atualizados com sucesso", "success");
      panelNavigate?.("people");
    } catch (err: unknown) {
      const msg =
        (err as { detail?: string })?.detail ||
        (err as Error)?.message ||
        "Erro ao atualizar pessoa";
      toast(msg, "error");
    }
  };

  const currentPhotoUrl = useMemo(() => {
    if (photo) return photo; // Captured preview base64
    if (person?.photo) return `${getApiBaseUrl()}/media/${person.photo}`;
    return "";
  }, [photo, person]);

  return (
    <form onSubmit={handleSubmit} className="flex-1 h-full flex flex-col relative overflow-hidden">
      <header className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Lucide.User size={22} className="text-primary" />
          <h2 className="text-xl font-bold text-text">Detalhes da Pessoa</h2>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="secondary"
            type="button"
            icon={<Lucide.ArrowLeft size={14} />}
            onClick={() => panelNavigate?.("people")}
          >
            Voltar
          </Button>
          <Button
            size="sm"
            variant="danger"
            type="button"
            icon={<Lucide.Trash size={14} />}
            onClick={() => setDeleteConfirm(true)}
          >
            Remover
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto mt-6 flex justify-center">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader w={50} />
          </div>
        ) : !person ? (
          <div className="flex flex-col items-center justify-center gap-3 mt-16 text-text-muted">
            <Lucide.UserX size={40} />
            <p>Pessoa não encontrada</p>
          </div>
        ) : (
          <div className="w-full max-w-xl space-y-6 pb-8">
            {/* Visual Header / Avatar Banner */}
            <div className="flex flex-col items-center gap-4 bg-white/[0.02] border border-white/[0.04] p-6 relative overflow-hidden">
              <div className="relative w-36 h-36 rounded-full overflow-hidden border-2 border-primary group">
                {currentPhotoUrl ? (
                  <img src={currentPhotoUrl} alt={person.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-surface flex items-center justify-center text-text-muted">
                    <Lucide.User size={50} />
                  </div>
                )}
                <button
                  type="button"
                  onClick={startCapture}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs gap-1.5 cursor-pointer"
                >
                  <Lucide.Camera size={20} />
                  Alterar Foto
                </button>
              </div>

              <div className="text-center">
                <h3 className="text-lg font-bold text-text">{person.full_name}</h3>
                <p className="text-xs text-text-muted mt-1">Registado em: {new Date(person.added_at).toLocaleDateString()}</p>
              </div>

              {banned && (
                <div className="absolute top-3 right-3 bg-red-500/10 text-red-500 border border-red-500/20 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 animate-pulse">
                  <Lucide.ShieldAlert size={12} />
                  Acesso Banido
                </div>
              )}
            </div>

            {/* Basic Info Fields */}
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-text">Primeiro nome *</label>
                <Input
                  placeholder="Primeiro nome"
                  value={firstName}
                  onChange={(e) => { setFirstName(e.target.value); setErrors((prev) => ({ ...prev, firstName: undefined })); }}
                  className={errors.firstName ? "border-red-400 focus:border-red-400 focus:ring-red-400/50" : ""}
                />
                {errors.firstName && <p className="text-xs text-red-400">{errors.firstName}</p>}
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-text">Sobrenome *</label>
                <Input
                  placeholder="Sobrenome"
                  value={lastName}
                  onChange={(e) => { setLastName(e.target.value); setErrors((prev) => ({ ...prev, lastName: undefined })); }}
                  className={errors.lastName ? "border-red-400 focus:border-red-400 focus:ring-red-400/50" : ""}
                />
                {errors.lastName && <p className="text-xs text-red-400">{errors.lastName}</p>}
              </div>
            </div>

            {/* Banned State Toggle */}
            <div className="bg-white/[0.02] border border-white/[0.04] p-5 flex items-center justify-between">
              <div className="space-y-1.5 pr-4">
                <label className="text-sm font-medium text-text">Bloquear Acesso (Banido)</label>
                <p className="text-xs text-text-muted">
                  Se ativado, o sistema emitirá alertas de alta prioridade quando esta pessoa for detetada.
                </p>
              </div>
              <Toggle
                checked={banned}
                onChange={(e) => setBanned(e.target.checked)}
              />
            </div>

            {/* Roles selector & fields */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text">Cargos / Perfis</label>
                <span className="text-xs text-text-muted">{selectedRoleIds.length} selecionado(s)</span>
              </div>
              <div className="relative">
                <Lucide.Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <Input
                  placeholder="Pesquisar cargo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <div className="max-h-[160px] overflow-y-auto border border-border bg-surface p-1 space-y-1">
                {filteredRoles.map((role) => (
                  <label
                    key={role.id}
                    className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                      selectedRoleIds.includes(role.id)
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-white/[0.04]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRoleIds.includes(role.id)}
                      onChange={() => toggleRole(role.id)}
                      className="w-4 h-4 rounded border-border accent-primary"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium">{role.name}</span>
                      {role.description && (
                        <span className="text-xs text-text-muted truncate">{role.description}</span>
                      )}
                    </div>
                  </label>
                ))}
                {filteredRoles.length === 0 && (
                  <p className="text-xs text-text-muted text-center py-4">Nenhum cargo encontrado</p>
                )}
              </div>
            </div>

            {/* Custom Field Values for selected roles */}
            {selectedRoles.map((role) => (
              <div key={role.id} className="space-y-3 border border-border p-4 bg-white/[0.01]">
                <h4 className="text-sm font-semibold text-primary">{role.name}</h4>
                {role.fields.length === 0 ? (
                  <p className="text-xs text-text-muted py-1">Nenhum campo personalizado definido.</p>
                ) : (
                  role.fields.sort((a, b) => a.sort_order - b.sort_order).map((field) => {
                    const val = roleFields[String(role.id)]?.[field.label] ?? "";
                    return (
                      <div key={field.id} className="space-y-1.5">
                        <label className="text-xs font-medium text-text">
                          {field.label}
                          {field.required && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        {field.field_type === "boolean" ? (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!val}
                              onChange={(e) => updateField(role.id, field.label, e.target.checked)}
                              className="w-4 h-4 rounded border-border accent-primary"
                            />
                            <span className="text-sm text-text-muted">Sim</span>
                          </label>
                        ) : field.field_type === "select" ? (
                          <select
                            value={val as string}
                            onChange={(e) => updateField(role.id, field.label, e.target.value)}
                            className="w-full h-12 border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:border-primary"
                            required={field.required}
                          >
                            <option value="">Selecione...</option>
                            {(field.options || []).map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <Input
                            type={field.field_type === "number" ? "number" : field.field_type === "date" ? "date" : "text"}
                            placeholder={field.label}
                            value={val as string}
                            onChange={(e) => updateField(role.id, field.label, e.target.value)}
                            required={field.required}
                          />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            ))}

            {/* Bottom Actions and Progress bar */}
            <div className="flex flex-col items-end gap-2 pt-4">
              {updatePerson.isPending && (
                <p className="text-xs text-text-muted flex items-center gap-1.5">
                  <Lucide.Loader2 size={12} className="animate-spin" />
                  A atualizar fotografia e dados, por favor aguarde...
                </p>
              )}
              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => panelNavigate?.("people")}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={updatePerson.isPending}>
                  {updatePerson.isPending ? (
                    <>
                      <Lucide.Loader2 size={16} className="animate-spin" />
                      A gravar...
                    </>
                  ) : (
                    "Gravar Alterações"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        className="max-w-md bg-surface-dark border border-border-dark p-6"
      >
        <h3 className="text-xl font-bold text-text mb-4">Confirmar remoção</h3>
        <p className="text-text-muted mb-6">
          Tem a certeza que deseja remover esta pessoa? Esta ação é irreversível.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={() => setDeleteConfirm(false)}>
            Cancelar
          </Button>
          <Button variant="danger" type="button" onClick={handleDelete}>
            Remover
          </Button>
        </div>
      </Modal>

      {showCapture && <PhotoCapture onCapture={handleCapture} />}
    </form>
  );
}
