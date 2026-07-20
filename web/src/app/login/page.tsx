"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FloatingLabelInput } from "@/components/FloatingLabelInput";
import { ArrowRight, Loader } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/components/ToastProvider";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao fazer login");
      router.push("/my-account");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg text-text">
      <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
        >
          <div className="flex items-center justify-center gap-1">
            <Image src="/logo.png" alt="SecureIT" width={25} height={25} loading="eager" fetchPriority="high" className="h-8 w-auto" />
            <h1 className="text-2xl font-bold leading-10 text-text tracking-tight">
              SecureIT
            </h1>
          </div>
        </Link>
        <ThemeToggle />
      </div>
      <div className="p-10 flex flex-col items-center w-full max-w-[480px]">
        <div className="w-full flex flex-col">
          <div className="flex flex-col items-center justify-center gap-1 mb-8">
            <h1 className="text-center text-3xl font-semibold">Iniciar Sessão</h1>
            <p className="text-text-muted">Insira os seus dados abaixo para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <FloatingLabelInput
              id="email"
              label="Endereço de E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <FloatingLabelInput
              id="password"
              label="Palavra-passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="submit"
              disabled={!email || !password || loading}
              className="w-full bg-primary text-white text-lg font-medium py-3 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader size={18} className="animate-spin" />
              ) : (
                <>
                  Entrar <ArrowRight size={18} />
                </>
              )}
            </button>
            <div className="text-center pt-4">
              <p className="text-base text-text-muted">
                Não tem conta?{" "}
                <Link
                  href="/signup"
                  className="text-primary font-bold hover:underline ml-1"
                >
                  Criar Conta
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
