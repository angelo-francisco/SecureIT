import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PinInput, Button } from "../ui";
import { useReAuthStore } from "../stores/reauth";
import { authApi } from "../api-client";
import { useAuthStore } from "../hooks";
import * as Lucide from "lucide-react";

const log = (...args: unknown[]) => console.log("[ReAuthModal]", ...args);

export function ReAuthModal() {
  const { pending, attempts, cooldownUntil, fail, succeed, dismiss } = useReAuthStore();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const rememberedAccount = localStorage.getItem("remembered_account");
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    useAuthStore.getState().clearAuth();
    navigate("/login", { replace: true });
    dismiss();
  }, [navigate]);

  const handlePinComplete = useCallback(async (pin: string) => {
    if (!rememberedAccount) {
      setError("Conta não encontrada, clique no botão abaixo");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await authApi.reAuth({ email: rememberedAccount, pin });
      localStorage.setItem("access_token", res.access_token);
      useAuthStore.getState().setAuth(res.user, res.access_token);
      succeed();
    } catch (err) {
      const shouldCooldown = fail();
      if (shouldCooldown) {
        setError("Código incorreto. Aguarde 15 segundos.");
      } else {
        setError(`Código incorrecto. Tentativa ${attempts + 1} de 3.`);
      }
    } finally {
      setLoading(false);
    }
  }, [rememberedAccount, attempts, fail, succeed]);

  const remainingCooldown = cooldownUntil ? Math.ceil((cooldownUntil - Date.now()) / 1000) : 0;

  if (!pending) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-surface border border-border p-8 w-full max-w-sm mx-4 shadow-2xl">
        {loading ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Lucide.Loader size={32} className="animate-spin text-primary" />
            <p className="text-text-muted text-sm">Verificando código...</p>
          </div>
        ) : cooldownUntil && remainingCooldown > 0 ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <Lucide.Clock size={32} className="text-red-400" />
            <p className="text-text font-semibold">Muitas tentativas</p>
            <p className="text-text-muted text-sm">Aguarde {remainingCooldown}s para tentar novamente</p>
          </div>
        ) : (
          <>
            <p className="text-text-muted text-sm text-center mb-6">
              Digite o seu código PIN para continuar
            </p>
            <PinInput onComplete={handlePinComplete} />
            {error && (
              <p className="text-red-400 text-xs text-center mt-4">{error}</p>
            )}
          </>
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
