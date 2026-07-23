import { Routes, Route, Navigate } from "react-router-dom";
import { PanelNoNavLayout } from "../layouts/PanelNoNavLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { LicenseGuard } from "../components/LicenseGuard";
import Login from "../pages/auth/Login";
import ProfileSwitcher from "../pages/profiles/ProfileSwitcher";
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
        <Route path="/profiles" element={<ProfileSwitcher />} />
      </Route>

      <Route
        element={
          <ProtectedRoute requireProfile>
            <LicenseGuard>
              <PanelNoNavLayout />
            </LicenseGuard>
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
