"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FloatingLabelInput } from "@/components/FloatingLabelInput";
import { ArrowLeft, ArrowRight, Lock, Loader } from "lucide-react";

type LoginStep = "email" | "password";

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStep("password");
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao fazer login");
      router.push("/admin");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao fazer login";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg text-text">
      <div className="p-10 flex flex-col items-center w-full max-w-[480px]">
        <div className="w-full flex flex-col">
          <div className="mb-12 text-center">
            <div className="flex items-center justify-center gap-1">
              <Image src="/logo.png" alt="SecureIT" width={64} height={64} className="h-16 w-auto" />
              <h1 className="text-5xl font-display font-bold leading-10 text-text tracking-tight">
                SecureIT
              </h1>
            </div>
            <p className="text-xl text-text-muted mt-1">
              Painel de administração
            </p>
          </div>

          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <p className="text-base text-text-muted mb-2 text-left">
                Insira o email de administrador
              </p>
              <FloatingLabelInput
                id="email"
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                type="submit"
                disabled={!email}
                className="w-full bg-primary text-white text-lg font-semibold py-4 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                Continuar <ArrowRight size={20} />
              </button>
              <div className="text-center pt-4">
                <p className="text-base text-text-muted">
                  <a
                    href="/login"
                    className="text-primary font-bold hover:underline ml-1"
                  >
                    Voltar ao login normal
                  </a>
                </p>
              </div>
            </form>
          )}

          {step === "password" && (
            <form onSubmit={handlePasswordLogin} className="space-y-6">
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setPassword("");
                  setError("");
                }}
                className="flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors"
              >
                <ArrowLeft size={16} />
                Voltar
              </button>

              <p className="text-base text-text-muted">
                Entrar como <span className="text-text font-medium">{email}</span>
              </p>

              {error && (
                <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm text-center">
                  {error}
                </div>
              )}

              <div>
                <label className="text-xs tracking-widest text-text-muted flex items-center gap-2 uppercase mb-2">
                  <Lock size={14} />
                  Palavra-passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 px-4 bg-transparent border-0 border-b-2 border-border rounded-none text-text text-base font-bold focus:border-primary focus:ring-0 focus:outline-none transition-colors caret-primary"
                  placeholder="••••••••••••"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading || !password}
                className="w-full bg-primary text-white text-lg font-semibold py-4 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <>
                    Entrar <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
