import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import AppRoutes from "./routes";
import { PinModal } from "./components/PinModal";
import { ThemeToggle } from "./components/ThemeToggle";
import splashGif from "./assets/splash.gif";

function App() {
  const [phase, setPhase] = useState<"splash" | "fading" | "app">("splash");
  const location = useLocation();
  const isAuthPage = ["/login", "/signup"].includes(location.pathname);

  useEffect(() => {
    const timer = setTimeout(() => setPhase("fading"), 2800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (phase === "fading") {
      const timer = setTimeout(() => setPhase("app"), 500);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  return (
    <>
      {phase !== "app" && (
        <div
          className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-500 ${
            phase === "fading" ? "opacity-0" : "opacity-100"
          }`}
        >
          <img src={splashGif} alt="Loading" className="w-150 h-auto object-cover" />
        </div>
      )}

      <div
        className={`transition-opacity duration-500 ${phase !== "app" ? "opacity-0" : "opacity-100"}`}
      >
        <AppRoutes />
        <PinModal />
        {!isAuthPage && <ThemeToggle />}
      </div>
    </>
  );
}

export default App;
