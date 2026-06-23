import { Outlet } from "react-router-dom";

export function PanelNoNavLayout() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <Outlet />
    </div>
  );
}
