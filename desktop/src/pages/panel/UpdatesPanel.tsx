import { useState } from "react";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { isRunningInTauri } from "../../api-client/api-base";
import { Button, Loader } from "@/packages/ui";
import * as Lucide from "lucide-react";
import { formatBytes } from "../../api-client/init";

export default function UpdatesPanel() {
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(false);
  const [working, setWorking] = useState(false);
  const [update, setUpdate] = useState<Update | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "downloading" | "ready">("idle");
  const [downloaded, setDownloaded] = useState(0);
  const [total, setTotal] = useState<number | null>(null);

  if (!isRunningInTauri()) {
    return (
      <p className="text-sm text-text-muted">
        A actualização está disponível apenas no app desktop.
      </p>
    );
  }

  async function handleCheck() {
    setChecking(true);
    setChecked(false);
    setError(null);
    setUpdate(null);
    setStatus("idle");
    try {
      const result = await check();
      setUpdate(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setChecked(true);
      setChecking(false);
    }
  }

  async function handleInstall() {
    if (!update) return;
    setWorking(true);
    setError(null);
    setStatus("downloading");
    setDownloaded(0);
    setTotal(null);
    try {
      await update.downloadAndInstall((event) => {
        if (event.event === "Started") {
          setTotal(event.data.contentLength ?? null);
        } else if (event.event === "Progress") {
          setDownloaded((d) => d + event.data.chunkLength);
        }
      });
      setStatus("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("idle");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      <div className="flex items-center justify-between py-3 border-b border-white/[0.06]">
        <div>
          <p className="text-sm font-medium text-text">Versão instalada</p>
          <p className="text-xs text-text-muted mt-1">
            {update ? `v${update.currentVersion}` : "—"}
          </p>
        </div>
        <Button
          size="md"
          icon={<Lucide.RefreshCw size={16} />}
          onClick={handleCheck}
          disabled={checking || working}
        >
          {checking ? "A verificar…" : "Verificar actualizações"}
        </Button>
      </div>

      {checking && (
        <div className="flex items-center gap-3 py-4">
          <Loader w={20} />
          <span className="text-sm text-text-muted">A verificar…</span>
        </div>
      )}

      {error && <p className="text-sm text-red-400 py-2">{error}</p>}

      {!checking && update && (
        <div className="py-4 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-text">
              Actualização disponível: v{update.version}
            </p>
            {status === "ready" ? (
              <Button size="md" icon={<Lucide.RefreshCcw size={16} />} onClick={() => relaunch()}>
                Reiniciar para aplicar
              </Button>
            ) : (
              <Button
                size="md"
                icon={<Lucide.Download size={16} />}
                onClick={handleInstall}
                disabled={working}
              >
                {status === "downloading" ? "A transferir…" : "Transferir e instalar"}
              </Button>
            )}
          </div>

          {status === "downloading" && (
            <div className="space-y-1.5">
              <div className="w-full h-1 rounded-full bg-white/[0.08] overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-200"
                  style={{
                    width:
                      total && downloaded > 0
                        ? `${Math.min(100, Math.round((downloaded / total) * 100))}%`
                        : "30%",
                  }}
                />
              </div>
              {total && downloaded > 0 && (
                <p className="text-xs text-text-muted">
                  {formatBytes(downloaded)} / {formatBytes(total)}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {!checking && checked && !update && !error && (
        <p className="text-sm text-text-muted py-2">
          A sua versão está actualizada.
        </p>
      )}
    </div>
  );
}
