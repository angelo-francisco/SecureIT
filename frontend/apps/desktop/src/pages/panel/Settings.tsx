import { useState, useEffect, type FormEvent } from "react";
import { useSettings, useUpdateSettings } from "../../hooks";
import { LucideInput, Loader } from "../../ui";
import * as Lucide from "lucide-react";

export default function Settings() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  const [fps, setFps] = useState("");
  const [mst, setMst] = useState("");
  const [met, setMet] = useState("");
  const [alertCooldown, setAlertCooldown] = useState("");
  const [detectEvery, setDetectEvery] = useState("");
  const [allowDraw, setAllowDraw] = useState(false);

  useEffect(() => {
    if (settings) {
      setFps(String(settings.fps));
      setMst(settings.monitoring_start_time);
      setMet(settings.monitoring_end_time);
      setAlertCooldown(String(settings.alert_cooldown));
      setDetectEvery(String(settings.detect_every));
      setAllowDraw(settings.allow_draw);
    }
  }, [settings]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await updateSettings.mutateAsync({
      fps: Number(fps),
      mst,
      met,
      alert_cooldown: Number(alertCooldown),
      detect_every: Number(detectEvery),
      allow_draw: allowDraw,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full flex-1 h-full flex flex-col items-center overflow-hidden py-6 px-4 relative z-10"
    >
      <header className="max-w-3xl w-full flex flex-row items-center justify-between gap-4 border-b border-gray-500 pb-3">
        <h2 className="text-white text-2xl md:text-4xl font-bold">
          Configurações
        </h2>
        <button
          type="submit"
          className="text-center flex items-center gap-2 font-semibold rounded-lg px-3 py-2 bg-blue-600 text-white cursor-pointer"
        >
          <Lucide.Save size={20} />
          Salvar
        </button>
      </header>
      {isLoading ? (
        <div className="flex items-center justify-center flex-1">
          <Loader w={50} />
        </div>
      ) : (
        <div className="max-w-3xl w-full flex-1 pt-3">
          <div className="flex flex-col gap-3">
            <div className="border-b border-gray-300 py-2 flex items-center justify-between">
              <span className="text-lg font-medium text-nowrap">
                Frames por segundo (FPS)
              </span>
              <div className="max-w-[150px]">
                <LucideInput
                  type="number"
                  name="fps"
                  value={fps}
                  onChange={(e) => setFps(e.target.value)}
                />
              </div>
            </div>
            <div className="border-b border-gray-300 py-2 flex items-center justify-between">
              <span className="text-lg font-medium text-nowrap">
                Início do monitoramento
              </span>
              <div className="max-w-[150px]">
                <LucideInput
                  type="text"
                  name="mst"
                  icon="Timer"
                  value={mst}
                  onChange={(e) => setMst(e.target.value)}
                />
              </div>
            </div>
            <div className="border-b border-gray-300 py-2 flex items-center justify-between text-nowrap">
              <span className="text-lg font-medium">
                Término do monitoramento
              </span>
              <div className="max-w-[150px]">
                <LucideInput
                  type="text"
                  name="met"
                  icon="Timer"
                  value={met}
                  onChange={(e) => setMet(e.target.value)}
                />
              </div>
            </div>
            <div className="border-b border-gray-300 py-2 flex items-center justify-between text-nowrap">
              <span className="text-lg font-medium">
                Tempo de espera extra (segundos)
              </span>
              <div className="max-w-[150px]">
                <LucideInput
                  type="number"
                  name="alert_cooldown"
                  icon="Timer"
                  value={alertCooldown}
                  onChange={(e) => setAlertCooldown(e.target.value)}
                />
              </div>
            </div>
            <div className="border-b border-gray-300 py-2 flex items-center justify-between text-nowrap">
              <span className="text-lg font-medium">
                Número de detecções por frames
              </span>
              <div className="max-w-[150px]">
                <LucideInput
                  type="number"
                  name="detect_every"
                  icon="Timer"
                  value={detectEvery}
                  onChange={(e) => setDetectEvery(e.target.value)}
                />
              </div>
            </div>
            <div className="py-2 flex items-center justify-between text-nowrap">
              <span className="text-lg font-medium">
                Permitir desenho
              </span>
              <div className="max-w-[150px]">
                <input
                  type="checkbox"
                  name="allow_draw"
                  checked={allowDraw}
                  onChange={(e) => setAllowDraw(e.target.checked)}
                  className="w-4 h-4"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
