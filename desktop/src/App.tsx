import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppRoutes from "./routes";
import { ThemeToggle } from "./components/ThemeToggle";
import { ReAuthModal } from "./components/ReAuthModal";
import { ToastContainer } from "../packages/ui";
import { authApi } from "./api-client";
import { useAuthStore } from "./hooks";


function App() {
  const [phase, setPhase] = useState<"splash" | "loader" | "fading" | "app">("splash");
  const [destination, setDestination] = useState<string | null>(null);
  const [gifDone, setGifDone] = useState(false);
  const [initialRedirectDone, setInitialRedirectDone] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage = ["/login", "/signup"].includes(location.pathname);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setAccounts = useAuthStore((s) => s.setAccounts);
  const readyRef = useRef(false);

  // Fetch accounts to determine destination
  useEffect(() => {
    async function checkAccounts() {
      try {
        const accounts = await authApi.accounts();
        setAccounts(accounts);
        setDestination(accounts.length === 0 ? "/signup?hasAccounts=false" : "/login");
      } catch {
        setDestination("/login");
      }
    }
    if (!accessToken) {
      checkAccounts();
    } else {
      setDestination("/panel");
    }
  }, [accessToken, setAccounts]);

  // GIF display timer
  useEffect(() => {
    const timer = setTimeout(() => setGifDone(true), 2800);
    return () => clearTimeout(timer);
  }, []);

  // After GIF ends: if destination ready → fade out, otherwise → show loader
  useEffect(() => {
    if (!gifDone || phase !== "splash") return;
    if (destination) {
      // Backend already responded, go straight to fading
      readyRef.current = true;
      setPhase("fading");
    } else {
      // Backend hasn't responded yet, show loader
      setPhase("loader");
    }
  }, [gifDone, destination, phase]);

  // When in loader phase and destination arrives → fade out
  useEffect(() => {
    if (phase === "loader" && destination && !readyRef.current) {
      readyRef.current = true;
      setPhase("fading");
    }
  }, [phase, destination]);

  // Transition from fading to app
  useEffect(() => {
    if (phase === "fading") {
      const timer = setTimeout(() => setPhase("app"), 500);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Navigate to destination once app is visible
  useEffect(() => {
    if (!initialRedirectDone && phase === "app" && destination && !accessToken) {
      setInitialRedirectDone(true);
      navigate(destination, { replace: true });
    }
  }, [phase, destination, accessToken, navigate, initialRedirectDone]);

  return (
    <>
      {phase !== "app" && (
        <div
          className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center text-center bg-bg transition-opacity duration-500 ${phase === "fading" ? "opacity-0" : "opacity-100"
            }`}
        >
          <div className="flex items-center justify-center gap-1 mb-2">
              <img
                src={"/logo.png"}
                alt="Logo"
                className="relative w-15 h-auto z-10"
              />
            <h1 className="text-text font-display text-4xl font-bold">
              SecureIT
            </h1>
          </div>
          <div className="LinearLoader"></div>
        </div>
      )}

      <div
        className={`transition-opacity cursor-default duration-500 ${phase !== "app" ? "opacity-0" : "opacity-100"}`}
      >
        <AppRoutes />
        {isAuthPage && <ThemeToggle />}
      </div>
      <ReAuthModal />
      <ToastContainer />
    </>
  );
}

export default App;

