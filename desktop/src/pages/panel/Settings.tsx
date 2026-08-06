import { useState, useEffect, type FormEvent } from "react";
import { useSettings, useUpdateSettings } from "../../hooks";
import { Loader, Button } from "@/packages/ui";
import { LucideInput } from "../../ui";
import * as Lucide from "lucide-react";
import DetectedFaces from "./DetectedFaces";
import LicenseSettings from "./LicenseSettings";

interface SettingsProps {
  onClose?: () => void;
}

type Tab = "config" | "faces" | "license";

const tabs: { id: Tab; label: string; icon: typeof Lucide.Settings }[] = [
  { id: "config", label: "Configurações", icon: Lucide.Settings },
  { id: "faces", label: "Rostos Detectados", icon: Lucide.ScanFace },
  { id: "license", label: "Licença", icon: Lucide.Key },
];

function TabBar({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  return (
    <div className="flex gap-1 mt-4 bg-white/[0.04] border border-white/[0.06] w-fit">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`cursor-pointer flex items-center gap-1.5 px-3 py-2.5 text-base font-medium transition-colors ${
            active === t.id
              ? "bg-primary/15 text-primary"
              : "text-text-muted hover:text-text"
          }`}
        >
          <t.icon size={14} />
          {t.label}
        </button>
      ))}
    </div>
  );
}

export default function Settings({ onClose }: SettingsProps) {
  const [tab, setTab] = useState<Tab>("config");
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
      monitoring_start_time: mst,
      monitoring_end_time: met,
      alert_cooldown: Number(alertCooldown),
      detect_every: Number(detectEvery),
      allow_draw: allowDraw,
    });
  };

  return (
    <div className="flex-1 h-full flex flex-col relative overflow-hidden">
      <header className="flex items-center justify-between shrink-0">
        <TabBar active={tab} onChange={setTab} />
        <div className="flex items-center gap-3">
          {tab === "config" && (
            <Button
              type="submit"
              size="md"
              icon={<Lucide.Save size={16} />}
              onClick={handleSubmit}
            >
              Salvar
            </Button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center justify-center p-3 cursor-pointer bg-white/[0.06] hover:bg-white/[0.12] text-gray-400 hover:text-white transition-all duration-150"
            >
              <Lucide.X size={16} strokeWidth={2} />
            </button>
          )}
        </div>
      </header>



      <div className="flex-1 overflow-y-auto mt-6">
        {tab === "config" && (
          <>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader w={50} />
              </div>
            ) : (
              <div className="w-full max-w-xl space-y-4 mx-auto">
                {[
                  { label: "Frames por segundo (FPS)", value: fps, setter: setFps, icon: "Eye" as const, type: "number" },
                  { label: "Início do monitoramento", value: mst, setter: setMst, icon: "Timer" as const, type: "time" },
                  { label: "Término do monitoramento", value: met, setter: setMet, icon: "Timer" as const, type: "time" },
                  { label: "Tempo de espera extra (segundos)", value: alertCooldown, setter: setAlertCooldown, icon: "Timer" as const, type: "number" },
                  { label: "Nº de detecções por frames", value: detectEvery, setter: setDetectEvery, icon: "Timer" as const, type: "number" },
                ].map((field) => (
                  <div key={field.label} className="flex items-center justify-between gap-4 py-3 border-b border-white/[0.06]">
                    <span className="text-sm font-medium text-text">{field.label}</span>
                    <div className="max-w-[160px]">
                      <LucideInput
                        type={field.type}
                        icon={field.icon}
                        value={field.value}
                        onChange={(e) => field.setter(e.target.value)}
                      />
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm font-medium text-text">Permitir desenho</span>
                  <button
                    type="button"
                    onClick={() => setAllowDraw(!allowDraw)}
                    className={`relative w-10 h-6 rounded-full transition-colors ${
                      allowDraw ? "bg-primary" : "bg-white/[0.12]"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                        allowDraw ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {tab === "faces" && <DetectedFaces />}

        {tab === "license" && <LicenseSettings onClose={onClose} />}
      </div>
    </div>
  );
}
