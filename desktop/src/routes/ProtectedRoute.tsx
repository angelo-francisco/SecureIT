
import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../hooks";
import { authApi } from "../api-client";
import { Loader } from "@/packages/ui";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireProfile?: boolean;
}

export function ProtectedRoute({ children, requireProfile = false }: ProtectedRouteProps) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const selectedProfile = useAuthStore((s) => s.selectedProfile);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      setChecking(false);
      setValid(false);
      return;
    }

    authApi
      .check()
      .then(() => setValid(true))
      .catch(() => {
        clearAuth();
        setValid(false);
      })
      .finally(() => setChecking(false));
  }, [accessToken, clearAuth]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <Loader w={40} />
      </div>
    );
  }

  if (!valid) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireProfile && !selectedProfile) {
    return <Navigate to="/profiles" replace />;
  }

  return <>{children}</>;
}
