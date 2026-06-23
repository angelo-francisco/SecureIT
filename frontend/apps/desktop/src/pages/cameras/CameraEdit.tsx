import { useState, useEffect, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCamera, useUpdateCamera } from "../../hooks";
import { Input, LucideInput, Button, Loader } from "../../ui";

export default function CameraEdit() {
  const { id } = useParams<{ id: string }>();
  const { data: camera, isLoading } = useCamera(Number(id));
  const updateCamera = useUpdateCamera(Number(id));
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [streamUrl, setStreamUrl] = useState("");

  useEffect(() => {
    if (camera) {
      setName(camera.name);
      setLocation(camera.location);
      if (camera.connection_type === "W") {
        setStreamUrl(camera.wificamera?.stream_url ?? "");
      }
    }
  }, [camera]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await updateCamera.mutateAsync({
      name,
      location,
      stream_url: camera?.connection_type === "W" ? streamUrl : undefined,
    });
    navigate("/cameras");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-76px)]">
        <Loader w={50} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="h-full relative z-10">
      <main className="flex-1 h-full flex flex-col relative overflow-hidden">
        <header className="w-full px-6 py-4 text-center">
          <h1 className="text-white text-2xl font-black">Editar câmara</h1>
          <p className="text-[#9dabb9] mt-1 text-sm">
            Altere os dados da câmara
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
            {camera?.connection_type === "W" && (
              <div className="space-y-2">
                <div className="mb-4 flex flex-col gap-1">
                  <label className="text-base text-white font-medium">
                    URL da Câmera
                  </label>
                  <LucideInput
                    placeholder="Exemplo: http://192.168.100.181:5555/stream"
                    type="url"
                    icon="Link"
                    name="stream_url"
                    value={streamUrl}
                    onChange={(e) => setStreamUrl(e.target.value)}
                  />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => navigate(-1)}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </div>
          </div>
        </div>
      </main>
    </form>
  );
}
