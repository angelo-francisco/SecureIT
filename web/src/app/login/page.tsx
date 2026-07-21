"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FloatingLabelInput } from "@/components/FloatingLabelInput";
import { Loader } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useToast } from "@/packages/ui";

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
      if (!res.ok) throw new Error((data as any).error || "Erro ao fazer login");
      router.push("/my-account");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen ">
      <Navbar />
      <section className="relative overflow-hidden min-h-screen flex justify-center items-center">

        <div className="p-5 flex flex-col items-center w-full max-w-[480px]">
          <div className="w-full flex flex-col">
            <div className="flex flex-col items-center justify-center gap-1 mb-6">
              <h1 className="text-center text-5xl font-semibold">Iniciar Sessão</h1>
              <p className="text-text-muted text-xl">Insira os seus dados abaixo para continuar</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-8">
              <div className="space-y-4">
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
              </div>
              <button
                type="submit"
                disabled={!email || !password || loading}
                className="cursor-pointer mt-5 w-full bg-primary text-white text-lg font-medium py-3 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <>
                    Avançar
                  </>
                )}
              </button>
              <div className="text-center pt-1">
                <p className="text-lg text-text-muted">
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
      </section>

    </div>
  );
}
