import { useState, type FormEvent } from "react";
import { useCreateCamera, useLocalDevices } from "../../hooks";
import { usePanelNavigate } from "../../hooks/usePanelNavigate";
import { useToast } from "../../hooks/useToast";
import { useLicense } from "../../hooks/useLicense";
import { Input, Button, OutlinedInput } from "@/packages/ui";
import { LucideInput, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../ui";
import type { CameraTask } from "../../types/camera";
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
  const [task, setTask] = useState<CameraTask>("D");
  const [errors, setErrors] = useState<FormErrors>({});
  const createCamera = useCreateCamera();
  const { data: localDevices } = useLocalDevices();
  const panelNavigate = usePanelNavigate();
  const { toast } = useToast();
  const license = useLicense();

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
    if (task === "FR" && !license.hasFeature("face_recognition")) {
      errs.name = "A sua licença não inclui Reconhecimento Facial";
    }
    if (task === "BA" && !license.hasFeature("analise_comportamental", "anlise_comportamental")) {
      errs.name = "A sua licença não inclui Análise de Comportamento";
    }
    return errs;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    let connection_info: Record<string, unknown> = {};

    switch (connectionType) {
      case "W":
        connection_info = {
          stream_url: streamUrl.trim(),
        };
        break;

      case "L":
        if (isDemo) {
          connection_info = {
            path: demoPath.trim(),
          };
        } else {
          const selected = localDevices?.find((camera) => camera.path === localCamera);
          connection_info = selected
            ? { id: selected.id, name: selected.name, path: selected.path }
            : {};
        }
        break;
    }
    try {
      await createCamera.mutateAsync({
        name: name.trim(),
        location: location.trim(),
        connection_type: connectionType as "L" | "W",
        connection_info,
        task,
        face_recognition: task === "FR",
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
          <Lucide.Plus size={30} className="text-primary" />
          <h2 className="text-2xl font-bold text-text">Nova Câmera</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="cursor-pointer flex items-center justify-center w-13 h-12 border border-gray-400 transition-all duration-150"
          >
            <Lucide.X size={20} strokeWidth={2} />
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto mt-6 flex justify-center">
        <div className="w-full max-w-xl space-y-5">
          <div className="flex gap-2 items-center justify-between">
            <div className="space-y-2 w-full py-2">
              <OutlinedInput label="Nome" id="camera-name"
                value={name}
                labelSize={"xl"}
                onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: undefined })); }}
                className={(errors.name ? "border-red-400 focus:border-red-400 focus:ring-red-400/50" : "") + "text-lg"}
              />
              {errors.name && <p className="text-base text-red-400">{errors.name}</p>}
            </div>

            <div className="space-y-2 w-full">
              <OutlinedInput label="Localização" id="camera-location" labelSize={"xl"}
                value={location}
                onChange={(e) => { setLocation(e.target.value); setErrors((prev) => ({ ...prev, location: undefined })); }}
                className={(errors.location ? "border-red-400 focus:border-red-400 focus:ring-red-400/50" : "") + "text-lg"}
              />
              {errors.location && <p className="text-base text-red-400">{errors.location}</p>}
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-base font-medium text-text">Tipo de Conexão</label>
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
              <label className="text-base font-medium text-text">URL da Câmera</label>
              <LucideInput
                placeholder="http://192.168.100.181:5555/stream"
                icon="Wifi"
                value={streamUrl}
                onChange={(e) => { setStreamUrl(e.target.value); setErrors((prev) => ({ ...prev, streamUrl: undefined })); }}
                className={(errors.streamUrl ? "border-red-400 focus:border-red-400 focus:ring-red-400/50" : "") + "text-lg"}
              />
              {errors.streamUrl && <p className="text-base text-red-400">{errors.streamUrl}</p>}
              <p className="text-lg text-text-muted">URL de streaming da câmera Wi-Fi</p>
            </div>
          )}

          {connectionType === "L" && (
            <>
              <div className="space-y-2">
                <label className="text-base font-medium text-text">Modo de Captura</label>
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
                  <label className="text-base font-medium text-text">Caminho do Ficheiro</label>
                  <Input
                    placeholder="/home/user/videos/demo.mp4"
                    value={demoPath}
                    onChange={(e) => { setDemoPath(e.target.value); setErrors((prev) => ({ ...prev, demoPath: undefined })); }}
                    className={(errors.demoPath ? "border-red-400 focus:border-red-400 focus:ring-red-400/50" : "") + "text-lg"}
                  />
                  {errors.demoPath && <p className="text-base text-red-400">{errors.demoPath}</p>}
                  <p className="text-lg text-text-muted">Caminho absoluto no servidor para o ficheiro de vídeo (.mp4, .avi, .mov)</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-base font-medium text-text">Dispositivo Local</label>
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
                  {errors.localCamera && <p className="text-base text-red-400">{errors.localCamera}</p>}
                  <p className="text-base text-text-muted">Dispositivo conectado fisicamente ao servidor</p>
                </div>
              )}
            </>
          )}

          <div className="pt-4 border-t border-border">
            <div className="space-y-3">
              <label className="text-base font-medium text-text">Tarefa da Câmara</label>
              <Select value={task} onValueChange={(v) => setTask(v as CameraTask)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="D">Detecção de Área</SelectItem>
                  <SelectItem value="FR" disabled={!license.hasFeature("face_recognition")}>Reconhecimento Facial{!license.hasFeature("face_recognition") && " (não disponível na licença)"}</SelectItem>
                  <SelectItem value="BA" disabled={!license.hasFeature("analise_comportamental", "anlise_comportamental")}>Análise de Comportamento{!license.hasFeature("analise_comportamental", "anlise_comportamental") && " (não disponível na licença)"}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-lg text-text-muted mt-1">
                {task === "D" && "Detetar pessoas na área de monitoramento"}
                {task === "FR" && "Detetar e reconhecer rostos automaticamente nesta câmara"}
                {task === "BA" && "Analisar comportamento suspeito e gerar alertas"}
              </p>
              {task !== "D" && ((task === "FR" && !license.hasFeature("face_recognition")) || (task === "BA" && !license.hasFeature("analise_comportamental", "anlise_comportamental"))) && (
                <p className="text-base text-red-400 mt-1">
                  A sua licença não inclui esta funcionalidade.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => panelNavigate?.("cameras")} className="rounded-none border bg-transparent cursor-pointer">
              <Lucide.ArrowLeft size={16} />
            </Button>
            <Button type="submit" className="w-full text-lg rounded-none">Adicionar</Button>
          </div>
        </div>
      </div>
    </form>
  );
}
