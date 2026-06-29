import { useState, useRef, useEffect } from "react";
import { useCamera, useUpdateCamera, useDeleteCamera } from "../../hooks";
import { useCameraViewStore } from "../../stores/cameraView";
import { usePanelNavigate } from "../../hooks/usePanelNavigate";
import { Button, Loader, Input, Toggle, Modal } from "../../ui";
import * as Lucide from "lucide-react";

export default function CameraView() {
  const cameraId = useCameraViewStore((s) => s.cameraId);
  const { data: camera, isLoading } = useCamera(cameraId);
  const updateCamera = useUpdateCamera();
  const deleteCamera = useDeleteCamera();
  const panelNavigate = usePanelNavigate();

  const [editingField, setEditingField] = useState<"name" | "location" | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingField) inputRef.current?.focus();
  }, [editingField]);

  function startEdit(field: "name" | "location") {
    if (!camera) return;
    setEditingField(field);
    setEditValue(camera[field]);
  }

  function cancelEdit() {
    setEditingField(null);
    setEditValue("");
  }

  async function saveEdit() {
    if (!camera || !editingField || !editValue.trim()) return;
    await updateCamera.mutateAsync({
      id: camera.id,
      data: { [editingField]: editValue.trim() },
    });
    setEditingField(null);
    setEditValue("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") cancelEdit();
  }

  async function handleDelete() {
    if (!camera) return;
    await deleteCamera.mutateAsync(camera.id);
    setDeleteConfirm(false);
    useCameraViewStore.getState().setCameraId(null);
    panelNavigate?.("cameras");
  }

  async function handleFaceRecognitionChange(checked: boolean) {
    if (!camera) return;
    await updateCamera.mutateAsync({
      id: camera.id,
      data: { face_recognition: checked },
    });
  }

  return (
    <div className="flex-1 h-full flex flex-col relative overflow-hidden">
      <header className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Lucide.Video size={22} className="text-primary" />
          <h2 className="text-xl font-bold text-text">Detalhes da Câmara</h2>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="secondary"
            icon={<Lucide.ArrowLeft size={14} />}
            onClick={() => panelNavigate?.("cameras")}
          >
            Voltar
          </Button>
          <Button
            size="sm"
            variant="danger"
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
        ) : !camera ? (
          <div className="flex flex-col items-center justify-center gap-3 mt-16 text-text-muted">
            <Lucide.VideoOff size={40} />
            <p>Câmara não encontrada</p>
          </div>
        ) : (
          <div className="w-full max-w-xl space-y-6">
            <EditableField
              label="Nome"
              value={camera.name}
              editing={editingField === "name"}
              editValue={editValue}
              onStartEdit={() => startEdit("name")}
              onEditChange={(v) => setEditValue(v)}
              onSave={saveEdit}
              onCancel={cancelEdit}
              onKeyDown={handleKeyDown}
              inputRef={inputRef}
            />

            <EditableField
              label="Localização"
              value={camera.location}
              editing={editingField === "location"}
              editValue={editValue}
              onStartEdit={() => startEdit("location")}
              onEditChange={(v) => setEditValue(v)}
              onSave={saveEdit}
              onCancel={cancelEdit}
              onKeyDown={handleKeyDown}
              inputRef={inputRef}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-text">Tipo de Conexão</label>
              <p className="text-sm text-text-secondary bg-white/[0.04] rounded-lg px-3 py-2">
                {camera.connection_type === "L" ? "Local / USB" : "Wi-Fi"}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text">Informações de Conexão</label>
              <pre className="text-sm text-text-secondary bg-white/[0.04] rounded-lg px-3 py-2 overflow-x-auto whitespace-pre-wrap font-mono">
                {camera.connection_info
                  ? JSON.stringify(camera.connection_info, null, 2)
                  : "—"}
              </pre>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text mr-2">Estado</label>
              <span
                className={`inline-flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-full font-medium ${
                  camera.status
                    ? "bg-green-400/10 text-green-400"
                    : "bg-red-400/10 text-red-400"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    camera.status ? "bg-green-400" : "bg-red-400"
                  }`}
                />
                {camera.status ? "Online" : "Offline"}
              </span>
            </div>

            <div className="pt-4 border-t border-border">
              <Toggle
                label="Reconhecimento facial"
                checked={camera.face_recognition}
                onChange={(e) => handleFaceRecognitionChange(e.target.checked)}
              />
              <p className="text-xs text-text-muted mt-1">
                Detetar e reconhecer rostos automaticamente nesta câmara
              </p>
            </div>

            <div className="pt-4 border-t border-border space-y-1 text-xs text-text-muted">
              <p>Criada em: {camera.created_at}</p>
              <p>Última actualização: {camera.updated_at}</p>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        className="max-w-md bg-surface-dark border border-border-dark rounded-xl p-6"
      >
        <h3 className="text-xl font-bold text-text mb-4">Confirmar remoção</h3>
        <p className="text-text-muted mb-6">
          Tem a certeza que deseja remover esta câmara?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirm(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Remover
          </Button>
        </div>
      </Modal>
    </div>
  );
}

interface EditableFieldProps {
  label: string;
  value: string;
  editing: boolean;
  editValue: string;
  onStartEdit: () => void;
  onEditChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

function EditableField({
  label,
  value,
  editing,
  editValue,
  onStartEdit,
  onEditChange,
  onSave,
  onCancel,
  onKeyDown,
  inputRef,
}: EditableFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-text">{label}</label>
      <div className="group relative">
        {editing ? (
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={editValue}
              onChange={(e) => onEditChange(e.target.value)}
              onKeyDown={onKeyDown}
              className="flex-1"
            />
            <button
              onClick={onSave}
              className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              title="Salvar"
            >
              <Lucide.Check size={16} />
            </button>
            <button
              onClick={onCancel}
              className="p-2 rounded-lg bg-white/[0.06] text-text-muted hover:text-white transition-colors"
              title="Cancelar"
            >
              <Lucide.X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary bg-white/[0.04] rounded-lg px-3 py-2 flex-1">
              {value}
            </span>
            <button
              onClick={onStartEdit}
              className="p-2 rounded-lg bg-white/[0.06] text-text-muted hover:text-primary opacity-0 group-hover:opacity-100 transition-all duration-150"
              title="Editar"
            >
              <Lucide.Pencil size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
