import { useState, type FormEvent } from "react";
import { useCreateCamera, useLocalDevices } from "../../hooks";
import { usePanelNavigate } from "../../hooks/usePanelNavigate";
import { Input, LucideInput, Button, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../ui";
import * as Lucide from "lucide-react";

interface CameraNewProps {
  onClose?: () => void;
}

export default function CameraNew({ onClose }: CameraNewProps) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [connectionType, setConnectionType] = useState("L");
  const [streamUrl, setStreamUrl] = useState("");
  const [localCamera, setLocalCamera] = useState("");
  const createCamera = useCreateCamera();
  const { data: localDevices } = useLocalDevices();
  const panelNavigate = usePanelNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const connection_info: Record<string, unknown> = {};
    if (connectionType === "W") {
      connection_info.stream_url = streamUrl;
    } else if (connectionType === "L") {
      connection_info.path = localCamera;
    }
    await createCamera.mutateAsync({
      name,
      location,
      connection_type: connectionType as "L" | "W",
      connection_info,
    });
    panelNavigate?.("cameras");
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
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text">Localização</label>
            <LucideInput
              placeholder="Localização da câmara"
              icon="MapPin"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text">Tipo de Conexão</label>
            <Select value={connectionType} onValueChange={setConnectionType}>
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
                onChange={(e) => setStreamUrl(e.target.value)}
              />
              <p className="text-xs text-text-muted">URL de streaming da câmera Wi-Fi</p>
            </div>
          )}

          {connectionType === "L" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-text">Dispositivo Local</label>
              <Select value={localCamera} onValueChange={setLocalCamera}>
                <SelectTrigger>
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
              <p className="text-xs text-text-muted">Dispositivo conectado fisicamente ao servidor</p>
            </div>
          )}

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
