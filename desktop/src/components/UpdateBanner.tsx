import { useState, useEffect, useCallback } from "react";
import {
  checkForAppUpdate,
  installAppUpdate,
  checkApiUpdate,
  installApiUpdate,
  onAppUpdateProgress,
  onApiUpdateProgress,
  type AppUpdateInfo,
  type ApiUpdateInfo,
  type UpdateProgress,
  type ApiUpdateProgress,
} from "../api-client/update";
import { isRunningInTauri } from "../api-client/api-base";
import * as Lucide from "lucide-react";

type UpdateTarget = "app" | "api" | null;

interface UpdateBannerProps {
  onDismiss?: () => void;
}

export function UpdateBanner({ onDismiss }: UpdateBannerProps) {
  const [appUpdate, setAppUpdate] = useState<AppUpdateInfo | null>(null);
  const [apiUpdate, setApiUpdate] = useState<ApiUpdateInfo | null>(null);
  const [installing, setInstalling] = useState<UpdateTarget>(null);
  const [appProgress, setAppProgress] = useState<UpdateProgress | null>(null);
  const [apiProgress, setApiProgress] = useState<ApiUpdateProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isRunningInTauri()) return;

    checkForAppUpdate().then((info) => {
      if (info?.available) setAppUpdate(info);
    });
    checkApiUpdate().then((info) => {
      if (info?.available) setApiUpdate(info);
    });
  }, []);

  useEffect(() => {
    const unsubs = [
      onAppUpdateProgress(setAppProgress),
      onApiUpdateProgress(setApiProgress),
    ];
    return () => unsubs.forEach((unsub) => unsub());
  }, []);

  const handleInstallApp = useCallback(async () => {
    setInstalling("app");
    setError(null);
    try {
      await installAppUpdate();
    } catch (e) {
      setError(String(e));
      setInstalling(null);
    }
  }, []);

  const handleInstallApi = useCallback(async () => {
    setInstalling("api");
    setError(null);
    try {
      await installApiUpdate();
      setApiUpdate(null);
      setInstalling(null);
    } catch (e) {
      setError(String(e));
      setInstalling(null);
    }
  }, []);

  if (dismissed || (!appUpdate && !apiUpdate)) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9990] max-w-sm">
      <div className="rounded-lg border border-border bg-bg-elevated p-4 shadow-lg">
        {appUpdate && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <Lucide.ArrowUpCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-text">
                App Update v{appUpdate.remote_version}
              </span>
            </div>
            {appUpdate.notes && (
              <p className="text-xs text-text-secondary mb-2 line-clamp-2">
                {appUpdate.notes}
              </p>
            )}
            {installing === "app" && appProgress ? (
              <div className="text-xs text-text-secondary">
                {appProgress.total > 0
                  ? `${Math.round((appProgress.downloaded / appProgress.total) * 100)}%`
                  : "Baixando..."}
              </div>
            ) : (
              <button
                onClick={handleInstallApp}
                disabled={!!installing}
                className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:opacity-90 disabled:opacity-50"
              >
                Atualizar App
              </button>
            )}
          </div>
        )}

        {apiUpdate && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Lucide.Server className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-text">
                API Update v{apiUpdate.remote_version}
              </span>
            </div>
            <p className="text-xs text-text-secondary mb-2">
              v{apiUpdate.current_version} → v{apiUpdate.remote_version}
            </p>
            {installing === "api" && apiProgress ? (
              <div className="text-xs text-text-secondary">
                {apiProgress.phase === "fetching_release" && "Procurando release..."}
                {apiProgress.phase === "downloading" && "Baixando..."}
                {apiProgress.phase === "extracting" && "Extraindo..."}
                {apiProgress.phase === "complete" && "Concluído! Reinicie o app."}
              </div>
            ) : (
              <button
                onClick={handleInstallApi}
                disabled={!!installing}
                className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:opacity-90 disabled:opacity-50"
              >
                Atualizar API
              </button>
            )}
          </div>
        )}

        {error && (
          <p className="text-xs text-red-500 mt-2">{error}</p>
        )}

        <button
          onClick={() => { setDismissed(true); onDismiss?.(); }}
          className="absolute top-2 right-2 text-text-secondary hover:text-text"
        >
          <Lucide.X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
