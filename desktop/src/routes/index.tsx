import { Routes, Route, Navigate } from "react-router-dom";
import { PanelNoNavLayout } from "../layouts/PanelNoNavLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import Login from "../pages/auth/Login";
import Dashboard from "../pages/panel/Dashboard";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <PanelNoNavLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/panel" element={<Dashboard />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
