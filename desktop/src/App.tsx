import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppRoutes from "./routes";
import { FullLoader, ToastProvider } from "@/packages/ui";
import { authApi } from "./api-client";
import { useAuthStore, loadRememberedCredentials } from "./hooks";
import {
  initAppRuntime,
  getBootstrapState,
  onBootstrapChange,
  formatBytes,
  type BootstrapState,
} from "./api-client/init";


function BootOverlay({ boot, onRetry }: { boot: BootstrapState; onRetry: () => void }) {
  if (boot.error) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center text-center bg-bg">
        <div className="flex items-center gap-3 mb-6">
          <img src="/logo.png" alt="SecureIT" className="w-8 h-auto" />
          <h1 className="text-text text-3xl font-bold">SecureIT</h1>
        </div>
        <p className="text-text-muted mb-2 max-w-sm text-sm">
          Não foi possível iniciar o motor de segurança.
        </p>
        <p className="text-red-400 text-xs max-w-sm mb-6 truncate w-full max-w-md">
          {boot.error}
        </p>
        <button
          onClick={onRetry}
          className="cursor-pointer px-5 py-2.5 bg-primary text-white font-medium rounded transition-colors hover:opacity-90"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const p = boot.progress;
  const label =
    p?.message === "a descarregar"
      ? `A descarregar ${p.component}…`
      : p?.message === "a instalar"
        ? `A instalar ${p.component}…`
        : p
          ? `A preparar ${p.component}…`
          : "A preparar o motor de segurança…";

  const pct =
    p && p.total
      ? Math.min(100, Math.round((p.downloaded / p.total) * 100))
      : 0;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center text-center bg-bg">
      <div className="flex items-center gap-3 mb-4">
        <img src="/logo.png" alt="SecureIT" className="w-8 h-auto" />
        <h1 className="text-text text-3xl font-bold">SecureIT</h1>
      </div>
      <p className="text-text-muted text-sm mb-3">{label}</p>
      <div className="w-[300px] h-1 rounded-full bg-white/[0.08] overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: pct ? `${pct}%` : "30%" }}
        />
      </div>
      {p && p.total ? (
        <p className="text-text-muted text-xs mt-2">
          {formatBytes(p.downloaded)} / {formatBytes(p.total)}
        </p>
      ) : null}
    </div>
  );
}


function App() {
  const [phase, setPhase] = useState<"splash" | "loader" | "fading" | "app">("splash");
  const [destination, setDestination] = useState<string | null>(null);
  const [gifDone, setGifDone] = useState(false);
  const [initialRedirectDone, setInitialRedirectDone] = useState(false);
  const [boot, setBoot] = useState<BootstrapState>(() => getBootstrapState());
  const location = useLocation();
  const navigate = useNavigate();
  const setAccounts = useAuthStore((s) => s.setAccounts);
  const readyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function resolveDestination() {
      const store = useAuthStore.getState();

      if (store.accessToken) {
        try {
          const res = await authApi.refresh();
          if (cancelled) return;
          store.setAccessToken(res.access_token);
          setDestination("/profiles");
          return;
        } catch {
          // refresh failed, try auto-login
        }
      }

      const creds = loadRememberedCredentials();
      if (creds) {
        try {
          const res = await authApi.login({ email: creds.email, password: creds.password });
          if (cancelled) return;
          store.setAccessToken(res.access_token ?? null);
          store.setUser(res.user);
          setDestination("/profiles");
          return;
        } catch {
          // auto-login failed
        }
      }

      if (cancelled) return;

      try {
        const accounts = await authApi.accounts();
        setAccounts(accounts);
      } catch { /* ignore */ }
      setDestination("/login");
    }

    resolveDestination();
    return () => { cancelled = true; };
  }, [setAccounts]);

  useEffect(() => {
    initAppRuntime();
    return onBootstrapChange(() => setBoot(getBootstrapState()));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setGifDone(true), 2800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!gifDone || phase !== "splash") return;
    if (destination && boot.apiBase) {
      readyRef.current = true;
      setPhase("fading");
    } else {
      setPhase("loader");
    }
  }, [gifDone, destination, phase, boot.apiBase]);

  useEffect(() => {
    if (phase === "loader" && destination && boot.apiBase && !readyRef.current) {
      readyRef.current = true;
      setPhase("fading");
    }
  }, [phase, destination, boot.apiBase]);

  useEffect(() => {
    if (phase === "fading") {
      const timer = setTimeout(() => setPhase("app"), 500);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  useEffect(() => {
    if (!initialRedirectDone && phase === "app" && destination) {
      const currentPath = location.pathname;
      const destPath = destination;
      if (currentPath !== destPath) {
        setInitialRedirectDone(true);
        navigate(destination, { replace: true });
      } else {
        setInitialRedirectDone(true);
      }
    }
  }, [phase, destination, navigate, initialRedirectDone, location.pathname]);

  return (
    <>
      {phase === "splash" && <FullLoader show />}
      {phase === "loader" && (
        <BootOverlay
          boot={boot}
          onRetry={() => {
            initAppRuntime();
          }}
        />
      )}

      <ToastProvider>
      <div
        className={`transition-opacity cursor-default duration-500 ${phase !== "app" ? "opacity-0" : "opacity-100"}`}
      >
        <AppRoutes />
      </div>
      </ToastProvider>
    </>
  );
}

export default App;
