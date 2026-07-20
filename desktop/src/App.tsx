import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppRoutes from "./routes";
import { ThemeToggle } from "./components/ThemeToggle";
import { ReAuthModal } from "./components/ReAuthModal";
import { ToastContainer, FullLoader } from "@/packages/ui";
import { authApi } from "./api-client";
import { useAuthStore } from "./hooks";


function App() {
  const [phase, setPhase] = useState<"splash" | "loader" | "fading" | "app">("splash");
  const [destination, setDestination] = useState<string | null>(null);
  const [gifDone, setGifDone] = useState(false);
  const [initialRedirectDone, setInitialRedirectDone] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/profiles";
  const accessToken = useAuthStore((s) => s.accessToken);
  const selectedProfile = useAuthStore((s) => s.selectedProfile);
  const setAccounts = useAuthStore((s) => s.setAccounts);
  const readyRef = useRef(false);

  useEffect(() => {
    async function checkAccounts() {
      try {
        const accounts = await authApi.accounts();
        setAccounts(accounts);
      } catch {
        // ignore
      }
      setDestination("/login");
    }
    if (!accessToken) {
      checkAccounts();
    } else if (selectedProfile) {
      setDestination("/panel");
    } else {
      setDestination("/profiles");
    }
  }, [accessToken, selectedProfile, setAccounts]);

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
