import { useState, useMemo, useRef, type FormEvent } from "react";
import { useCreatePerson, useRoles } from "../../hooks";
import { usePanelNavigate } from "../../hooks/usePanelNavigate";
import { useToast } from "../../hooks/useToast";
import { Button, Input } from "@secureit/ui";
import { PhotoCapture, usePhotoCapture } from "../../ui";
import * as Lucide from "lucide-react";

interface PersonNewProps {
  onClose?: () => void;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  photo?: string;
}

export default function PersonNew({ onClose }: PersonNewProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const { photo, showCapture, setShowCapture, startCapture, handleCapture } = usePhotoCapture();
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [roleFields, setRoleFields] = useState<Record<string, Record<string, unknown>>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!firstName.trim()) errs.firstName = "O primeiro nome é obrigatório";
    if (!lastName.trim()) errs.lastName = "O sobrenome é obrigatório";
    if (!photo) errs.photo = "A fotografia é obrigatória";
    return errs;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const data = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      photo_base64: photo,
      roles: selectedRoles.map((role) => ({
        role_id: role.id,
        field_values: roleFields[String(role.id)] || {},
      })),
    };

    try {
      await createPerson.mutateAsync(data);
      toast("Pessoa criada com sucesso", "success");
      panelNavigate?.("people");
    } catch (err: unknown) {
      const msg =
        (err as { detail?: string })?.detail ||
        (err as Error)?.message ||
        "Erro ao criar pessoa";
      setErrors((prev) => ({ ...prev, firstName: msg }));
      toast(msg, "error");
    }
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
            onClick={(e) => {
              e.preventDefault();
              onClose();
            }}
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
            <label className="text-sm font-medium text-text mb-2">Fotografia *</label>
            {photo ? (
              <div className="relative w-40 h-40 rounded-xl overflow-hidden border border-border">
                <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute bottom-2 right-2 flex gap-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
                    title="Upload foto"
                  >
                    <Lucide.Upload size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { startCapture(); }}
                    className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
                    title="Capturar da câmara"
                  >
                    <Lucide.RefreshCw size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={startCapture}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg border border-dashed text-text-muted hover:text-primary hover:border-primary transition-colors text-sm ${
                    errors.photo ? "border-red-400 text-red-400" : "border-border"
                  }`}
                >
                  <Lucide.Camera size={18} />
                  Capturar
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg border border-dashed text-text-muted hover:text-primary hover:border-primary transition-colors text-sm ${
                    errors.photo ? "border-red-400 text-red-400" : "border-border"
                  }`}
                >
                  <Lucide.Upload size={18} />
                  Upload
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  handleCapture(reader.result as string);
                };
                reader.readAsDataURL(file);
              }}
              className="hidden"
            />
            {errors.photo && <p className="text-xs text-red-400">{errors.photo}</p>}
          </div>

          <div className="flex flex-col items-end gap-2 pt-4">
            {createPerson.isPending && (
              <p className="text-xs text-text-muted flex items-center gap-1.5">
                <Lucide.Loader2 size={12} className="animate-spin" />
                A processar fotografia, pode levar até 5 segundos...
              </p>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => panelNavigate?.("people")}>
                <Lucide.ArrowLeft size={16} />
                Voltar
              </Button>
              <Button type="submit" disabled={createPerson.isPending}>
                {createPerson.isPending ? (
                  <>
                    <Lucide.Loader2 size={16} className="animate-spin" />
                    A criar...
                  </>
                ) : (
                  "Adicionar"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showCapture && <PhotoCapture onCapture={handleCapture} onCancel={() => setShowCapture(false)} />}
    </form>
  );
}
