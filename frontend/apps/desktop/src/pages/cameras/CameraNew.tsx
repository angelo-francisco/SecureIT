import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateCamera, useLocalDevices } from "../../hooks";
import { usePanelNavigate } from "../../hooks/usePanelNavigate";
import { Input, LucideInput, Button } from "../../ui";

export default function CameraNew() {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [connectionType, setConnectionType] = useState("L");
  const [streamUrl, setStreamUrl] = useState("");
  const [localCamera, setLocalCamera] = useState("");
  const createCamera = useCreateCamera();
  const { data: localDevices } = useLocalDevices();
  const navigate = useNavigate();
  const panelNavigate = usePanelNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await createCamera.mutateAsync({
      name,
      location,
      connection_type: connectionType as "L" | "W",
      stream_url: connectionType === "W" ? streamUrl : undefined,
      local_camera: connectionType === "L" ? localCamera : undefined,
    });
    if (panelNavigate) {
      panelNavigate("cameras");
    } else {
      navigate("/cameras");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="h-full relative z-10">
      <main className="flex-1 h-full flex flex-col relative overflow-hidden">
        <header className="w-full px-6 py-4 text-center">
          <h1 className="text-white text-2xl font-black">Adicionar câmara</h1>
          <p className="text-[#9dabb9] mt-1 text-sm">
            Selecione o tipo de conexão da câmera e configure o acesso
          </p>
        </header>
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl rounded-xl bg-[#1c2127] px-8 py-5 border border-[#283039] shadow-xl">
            <div className="mb-4 flex flex-col justify-start gap-1">
              <label className="text-base text-white font-medium">
                Nome da câmara
              </label>
              <Input
                placeholder="Nome da câmara"
                type="text"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="mb-4 flex flex-col justify-start gap-1">
              <label className="text-base text-white font-medium">
                Localização
              </label>
              <LucideInput
                placeholder="Localização da câmara"
                type="text"
                icon="MapPin"
                name="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
            <div className="mb-4 flex flex-col justify-start gap-1">
              <label className="block text-base font-medium text-white mb-1">
                Tipo de Conexão
              </label>
              <select
                value={connectionType}
                onChange={(e) => setConnectionType(e.target.value)}
                className="w-full h-10 rounded-lg border border-[#3b4754] bg-[#283039] px-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              >
                <option value="L">Local / USB</option>
                <option value="W">Wi-Fi</option>
              </select>
            </div>
            <div className="space-y-4">
              {connectionType === "W" && (
                <div className="space-y-2">
                  <div className="mb-4 flex flex-col gap-1">
                    <label className="text-base text-white font-medium">
                      URL da Câmera
                    </label>
                    <Input
                      placeholder="Exemplo: http://192.168.100.181:5555/stream"
                      type="url"
                      name="stream_url"
                      value={streamUrl}
                      onChange={(e) => setStreamUrl(e.target.value)}
                    />
                  </div>
                </div>
              )}
              {connectionType === "L" && (
                <div className="space-y-2">
                  <label className="text-sm text-white font-medium">
                    Dispositivo Detectado
                  </label>
                  <select
                    name="local_camera"
                    value={localCamera}
                    onChange={(e) => setLocalCamera(e.target.value)}
                    className="w-full h-10 rounded-lg border border-[#3b4754] bg-[#283039] px-3 text-white"
                  >
                    <option disabled value="">
                      {localDevices
                        ? "Selecione uma das câmaras"
                        : "Carregando..."}
                    </option>
                    {localDevices?.map((cam) => (
                      <option key={cam.path} value={cam.path}>
                        {cam.name} ({cam.path})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    Dispositivo conectado fisicamente ao servidor
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => navigate(-1)}
              >
                Cancelar
              </Button>
              <Button type="submit">Adicionar</Button>
            </div>
          </div>
        </div>
      </main>
    </form>
  );
}
