import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/packages/ui";
import { useReAuthStore } from "../stores/reauth";
import { authApi } from "../api-client";
import { useAuthStore } from "../hooks";
import * as Lucide from "lucide-react";
import { useToast } from "@/packages/ui";

export function ReAuthModal() {
  const { pending, attempts, cooldownUntil, fail, succeed, dismiss } = useReAuthStore();
  const [error, setError] = useState("");
  const { toast } = useToast()
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    useAuthStore.getState().clearAuth();
    navigate("/login", { replace: true });
    dismiss();
  }, [navigate]);

  const handlePasswordSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const user = useAuthStore.getState().user;
    if (!user) {
      setError("Conta não encontrada, clique no botão abaixo");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await authApi.login({ email: user.email, password });
      succeed();
    } catch {
      const shouldCooldown = fail();
      if (shouldCooldown) {
        setError("Palavra-passe incorreta. Aguarde 15 segundos.");
      } else {
        setError(`Palavra-passe incorrecta. Tentativa ${attempts + 1} de 3.`);
      }
    } finally {
      setLoading(false);
      setPassword("");
    }
  }, [attempts, fail, succeed]);

  const remainingCooldown = cooldownUntil ? Math.ceil((cooldownUntil - Date.now()) / 1000) : 0;

  if (!pending) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-surface border border-border p-8 w-full max-w-sm mx-4 shadow-2xl">
        {loading ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Lucide.Loader size={32} className="animate-spin text-primary" />
            <p className="text-text-muted text-sm">Verificando...</p>
          </div>
        ) : cooldownUntil && remainingCooldown > 0 ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <Lucide.Clock size={32} className="text-red-400" />
            <p className="text-text font-semibold">Muitas tentativas</p>
            <p className="text-text-muted text-sm">Aguarde {remainingCooldown}s para tentar novamente</p>
          </div>
        ) : (
          <form onSubmit={handlePasswordSubmit}>
            <p className="text-text-muted text-sm text-center mb-6">
              Digite a sua palavra-passe para continuar
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 px-4 bg-transparent border-0 border-b-2 border-border rounded-none text-center text-text text-base font-bold focus:border-primary focus:ring-0 focus:outline-none transition-colors caret-primary"
              placeholder="••••••••••••"
              autoFocus
            />
            {error && (
              <p className="text-red-400 text-xs text-center mt-4">{error}</p>
            )}
            <div className="flex justify-center mt-6">
              <Button
                type="submit"
                disabled={loading || !password}
                size="sm"
              >
                Verificar
              </Button>
            </div>
          </form>
        )}
        <div className="flex justify-center mt-6">
          <Button variant="secondary" size="sm" onClick={handleLogout}>
            Ir para Login
          </Button>
        </div>
      </div>
    </div>
  );
}
