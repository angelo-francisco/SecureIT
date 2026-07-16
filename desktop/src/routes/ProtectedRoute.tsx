
import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../hooks";
import { authApi } from "../api-client";
import { Loader } from "../packages/ui";
import type { ReactNode } from "react";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
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

  return <>{children}</>;
}
