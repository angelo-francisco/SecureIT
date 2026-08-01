import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppRoutes from "./routes";
import { FullLoader, ToastProvider } from "@/packages/ui";
import { authApi } from "./api-client";
import { useAuthStore, loadRememberedCredentials } from "./hooks";


function App() {
  const [phase, setPhase] = useState<"splash" | "loader" | "fading" | "app">("splash");
  const [destination, setDestination] = useState<string | null>(null);
  const [gifDone, setGifDone] = useState(false);
  const [initialRedirectDone, setInitialRedirectDone] = useState(false);
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
    const timer = setTimeout(() => setGifDone(true), 2800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!gifDone || phase !== "splash") return;
    if (destination) {
      readyRef.current = true;
      setPhase("fading");
    } else {
      setPhase("loader");
    }
  }, [gifDone, destination, phase]);

  useEffect(() => {
    if (phase === "loader" && destination && !readyRef.current) {
      readyRef.current = true;
      setPhase("fading");
    }
  }, [phase, destination]);

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
      {phase !== "app" && (
        <FullLoader show={phase !== "fading"} />
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
