import { useState, type FormEvent } from "react";
import { useCreateCamera, useLocalDevices } from "../../hooks";
import { usePanelNavigate } from "../../hooks/usePanelNavigate";
import { useToast } from "../../hooks/useToast";
import { Input, Button, Toggle } from "@packages/ui";
import { LucideInput, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../ui";
import * as Lucide from "lucide-react";

interface CameraNewProps {
  onClose?: () => void;
}

interface FormErrors {
  name?: string;
  location?: string;
  streamUrl?: string;
  localCamera?: string;
  demoPath?: string;
}

export default function CameraNew({ onClose }: CameraNewProps) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [connectionType, setConnectionType] = useState("L");
  const [streamUrl, setStreamUrl] = useState("");
  const [localCamera, setLocalCamera] = useState("");
  const [isDemo, setIsDemo] = useState(false);
  const [demoPath, setDemoPath] = useState("");
  const [faceRecognition, setFaceRecognition] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const createCamera = useCreateCamera();
  const { data: localDevices } = useLocalDevices();
  const panelNavigate = usePanelNavigate();
  const { toast } = useToast();

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!name.trim()) {
      errs.name = "O nome é obrigatório";
    } else if (name.length > 30) {
      errs.name = "O nome deve ter no máximo 30 caracteres";
    }
    if (!location.trim()) {
      errs.location = "A localização é obrigatória";
    } else if (location.length > 150) {
      errs.location = "A localização deve ter no máximo 150 caracteres";
    }
    if (connectionType === "W") {
      if (!streamUrl.trim()) {
        errs.streamUrl = "O URL de streaming é obrigatório";
      } else if (!/^https?:\/\/|^rtsp:\/\//.test(streamUrl.trim())) {
        errs.streamUrl = "URL inválida. Use HTTP, HTTPS ou RTSP.";
      }
    }
    if (connectionType === "L" && !isDemo && !localCamera) {
      errs.localCamera = "Selecione um dispositivo local";
    }
    if (connectionType === "L" && isDemo && !demoPath.trim()) {
      errs.demoPath = "O caminho do ficheiro é obrigatório";
    }
    return errs;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const connection_info: Record<string, unknown> = {};
    if (connectionType === "W") {
      connection_info.stream_url = streamUrl.trim();
    } else if (connectionType === "L") {
      connection_info.path = isDemo ? demoPath.trim() : localCamera;
    }
    try {
      await createCamera.mutateAsync({
        name: name.trim(),
        location: location.trim(),
        connection_type: connectionType as "L" | "W",
        connection_info,
        face_recognition: faceRecognition,
      });
      toast("Câmara criada com sucesso", "success");
      panelNavigate?.("cameras");
    } catch (err: unknown) {
      const msg = (err as { detail?: string })?.detail || "Erro ao criar câmara. Verifique os dados e tente novamente.";
      setErrors({ name: msg });
      toast(msg, "error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 h-full flex flex-col relative overflow-hidden">
      <header className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Lucide.Plus size={22} className="text-primary" />
          <h2 className="text-xl font-bold text-text">Nova Câmera</h2>
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
          <div className="space-y-2">
            <label className="text-sm font-medium text-text">Nome da câmara</label>
            <Input
              placeholder="Nome da câmara"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: undefined })); }}
              className={errors.name ? "border-red-400 focus:border-red-400 focus:ring-red-400/50" : ""}
            />
            {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text">Localização</label>
            <LucideInput
              placeholder="Localização da câmara"
              icon="MapPin"
              value={location}
              onChange={(e) => { setLocation(e.target.value); setErrors((prev) => ({ ...prev, location: undefined })); }}
              className={errors.location ? "border-red-400 focus:border-red-400 focus:ring-red-400/50" : ""}
            />
            {errors.location && <p className="text-xs text-red-400">{errors.location}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text">Tipo de Conexão</label>
            <Select value={connectionType} onValueChange={(v) => { setConnectionType(v); setErrors({}); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="L">Local / USB</SelectItem>
                <SelectItem value="W">Wi-Fi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {connectionType === "W" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-text">URL da Câmera</label>
              <LucideInput
                placeholder="http://192.168.100.181:5555/stream"
                icon="Wifi"
                value={streamUrl}
                onChange={(e) => { setStreamUrl(e.target.value); setErrors((prev) => ({ ...prev, streamUrl: undefined })); }}
                className={errors.streamUrl ? "border-red-400 focus:border-red-400 focus:ring-red-400/50" : ""}
              />
              {errors.streamUrl && <p className="text-xs text-red-400">{errors.streamUrl}</p>}
              <p className="text-xs text-text-muted">URL de streaming da câmera Wi-Fi</p>
            </div>
          )}

          {connectionType === "L" && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text">Modo de Captura</label>
                <Select value={isDemo ? "demo" : "camera"} onValueChange={(v) => { setIsDemo(v === "demo"); setErrors({}); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="camera">Câmara Real</SelectItem>
                    <SelectItem value="demo">Ficheiro de Vídeo (Demo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isDemo ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text">Caminho do Ficheiro</label>
                  <Input
                    placeholder="/home/user/videos/demo.mp4"
                    value={demoPath}
                    onChange={(e) => { setDemoPath(e.target.value); setErrors((prev) => ({ ...prev, demoPath: undefined })); }}
                    className={errors.demoPath ? "border-red-400 focus:border-red-400 focus:ring-red-400/50" : ""}
                  />
                  {errors.demoPath && <p className="text-xs text-red-400">{errors.demoPath}</p>}
                  <p className="text-xs text-text-muted">Caminho absoluto no servidor para o ficheiro de vídeo (.mp4, .avi, .mov)</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text">Dispositivo Local</label>
                  <Select value={localCamera} onValueChange={(v) => { setLocalCamera(v); setErrors((prev) => ({ ...prev, localCamera: undefined })); }}>
                    <SelectTrigger className={errors.localCamera ? "border-red-400" : ""}>
                      <SelectValue placeholder={localDevices ? "Selecione uma câmara" : "Carregando..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {localDevices?.map((cam) => (
                        <SelectItem key={cam.path} value={cam.path}>
                          {cam.name} ({cam.path})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.localCamera && <p className="text-xs text-red-400">{errors.localCamera}</p>}
                  <p className="text-xs text-text-muted">Dispositivo conectado fisicamente ao servidor</p>
                </div>
              )}
            </>
          )}

          <div className="pt-4 border-t border-border">
            <Toggle
              label="Reconhecimento facial"
              checked={faceRecognition}
              onChange={(e) => setFaceRecognition(e.target.checked)}
            />
            <p className="text-xs text-text-muted mt-1">
              Detetar e reconhecer rostos automaticamente nesta câmara
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => panelNavigate?.("cameras")}>
              <Lucide.ArrowLeft size={16} />
              Voltar
            </Button>
            <Button type="submit">Adicionar</Button>
          </div>
        </div>
      </div>
    </form>
  );
}
