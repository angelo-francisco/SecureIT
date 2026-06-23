import { Outlet } from "react-router-dom";
import { Navbar } from "../components/Navbar";

export function PanelLayout() {
  return (
    <div className="min-h-screen bg-bg text-text flex flex-col">
      <div className="min-h-screen fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div
          className="absolute inset-0 opacity-20 brightness-100 contrast-150 mix-blend-overlay"
          style={{ backgroundImage: "url(/src/assets/noise.svg)" }}
        ></div>
      </div>
      <Navbar />
      <div className="relative z-10 flex-1 flex flex-col">
        <Outlet />
      </div>
    </div>
  );
}
