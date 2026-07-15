"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@secureit/ui";
import { Input } from "@secureit/ui";
import { Alert } from "@/components/ui/alert";
import { Shield, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao fazer login");
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white">
            SecureIT
          </h1>
          <p className="text-text-muted mt-2">Aceda a sua conta</p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-border rounded-2xl p-8 space-y-6"
        >
          {error && <Alert variant="error">{error}</Alert>}
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">
              Palavra-passe
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="************"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                A entrar...
              </>
            ) : (
              "Entrar"
            )}
          </Button>
        </form>
        <p className="text-center text-text-muted text-sm mt-6">
          Nao tem conta?{" "}
          <Link
            href="/signup"
            className="text-primary hover:text-primary-hover font-medium transition-colors"
          >
            Criar Conta
          </Link>
        </p>
      </div>
    </div>
  );
}
