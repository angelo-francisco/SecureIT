import { Outlet } from "react-router-dom";
import { BackgroundVideo } from "../components/BackgroundVideo";

export function AuthLayout() {
  return (
    <div className="min-h-screen text-text relative">
      <BackgroundVideo />
      <main className="relative z-[2] flex items-center justify-center min-h-screen p-4 sm:p-8">
        <Outlet />
      </main>
    </div>
  );
}
