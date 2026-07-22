import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../hooks";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireProfile?: boolean;
}

export function ProtectedRoute({ children, requireProfile = false }: ProtectedRouteProps) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const selectedProfile = useAuthStore((s) => s.selectedProfile);
  const location = useLocation();

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireProfile && !selectedProfile) {
    return <Navigate to="/profiles" replace />;
  }

  return <>{children}</>;
}
