import { useState, useMemo, type FormEvent } from "react";
import { useCreatePerson, useRoles } from "../../hooks";
import { usePanelNavigate } from "../../hooks/usePanelNavigate";
import { Button, Input, PhotoCapture, usePhotoCapture } from "../../ui";
import * as Lucide from "lucide-react";
interface PersonNewProps {
  onClose?: () => void;
}

export default function PersonNew({ onClose }: PersonNewProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const { photo, showCapture, startCapture, handleCapture } = usePhotoCapture();
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [roleFields, setRoleFields] = useState<Record<string, Record<string, unknown>>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const createPerson = useCreatePerson();
  const { data: roles } = useRoles();
  const panelNavigate = usePanelNavigate();

  const filteredRoles = useMemo(() => {
    if (!roles) return [];
    if (!searchQuery) return roles;
    const q = searchQuery.toLowerCase();
    return roles.filter(
      (r) => r.name.toLowerCase().includes(q) || (r.description && r.description.toLowerCase().includes(q))
    );
  }, [roles, searchQuery]);

  const selectedRoles = useMemo(() => {
    if (!roles) return [];
    return roles.filter((r) => selectedRoleIds.includes(r.id));
  }, [roles, selectedRoleIds]);

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (selectedRoleIds.length === 0) return;

    const data = {
      first_name: firstName,
      last_name: lastName,
      photo_base64: photo,
      roles: selectedRoles.map((role) => ({
        role_id: role.id,
        field_values: roleFields[String(role.id)] || {},
      })),
    };

    await createPerson.mutateAsync(data);
    panelNavigate?.("people");
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 h-full flex flex-col relative overflow-hidden">
      <header className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Lucide.UserPlus size={22} className="text-primary" />
          <h2 className="text-xl font-bold text-text">Nova Pessoa</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-gray-400 hover:text-white transition-all duration-150"
          >
            <Lucide.X size={16} strokeWidth={2} />
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto mt-6 flex justify-center">
        <div className="w-full max-w-xl space-y-5">
          <div className="flex gap-3">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-text">Primeiro nome *</label>
              <Input
                placeholder="Primeiro nome"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-text">Sobrenome *</label>
              <Input
                placeholder="Sobrenome"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text">Cargos</label>
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
            <div className="max-h-[160px] overflow-y-auto rounded-lg border border-border bg-surface p-1 space-y-1">
              {filteredRoles.map((role) => (
                <label
                  key={role.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
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

          {selectedRoles.map((role) => (
            <div key={role.id} className="space-y-3 border border-border rounded-xl p-4">
              <h4 className="text-sm font-semibold text-primary">{role.name}</h4>
              {role.fields.length === 0 ? (
                <p className="text-xs text-text-muted py-2">Nenhum campo personalizado definido.</p>
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
                          className="w-full h-12 rounded-lg border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:border-primary"
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

          <div className="space-y-2">
            <label className="text-sm font-medium text-text">Fotografia</label>
            {photo ? (
              <div className="relative w-40 h-40 rounded-xl overflow-hidden border border-border">
                <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => { startCapture(); }}
                  className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
                >
                  <Lucide.RefreshCw size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={startCapture}
                className="flex items-center gap-2 px-4 py-3 rounded-lg border border-dashed border-border text-text-muted hover:text-primary hover:border-primary transition-colors text-sm"
              >
                <Lucide.Camera size={18} />
                Capturar fotografia
              </button>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => panelNavigate?.("people")}>
              <Lucide.ArrowLeft size={16} />
              Voltar
            </Button>
            <Button type="submit">Adicionar</Button>
          </div>
        </div>
      </div>

      {showCapture && <PhotoCapture onCapture={handleCapture} />}
    </form>
  );
}
