"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "secureit-ui";
import { Input } from "secureit-ui";
import { Alert } from "@/components/ui/alert";
import { Shield, Loader2, ArrowLeft } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (step === 1) {
      if (!formData.email) return;
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!formData.firstName || !formData.lastName) return;
      setStep(3);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("As palavras-passe nao coincidem");
      return;
    }
    if (formData.password.length < 12) {
      setError("Palavra-passe deve ter pelo menos 12 caracteres");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || undefined,
          password: formData.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar conta");
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta");
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
          <p className="text-text-muted mt-2">Crie a sua conta</p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-border rounded-2xl p-8 space-y-6"
        >
          {error && <Alert variant="error">{error}</Alert>}

          {step === 1 && (
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">
                Email
              </label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="seu@email.com"
                required
              />
            </div>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">
                  Primeiro Nome
                </label>
                <Input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">
                  Ultimo Nome
                </label>
                <Input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">
                  Telemovel (opcional)
                </label>
                <Input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">
                  Palavra-passe
                </label>
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimo 12 caracteres"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">
                  Confirmar Palavra-passe
                </label>
                <Input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </>
          )}

          <div className="flex gap-3">
            {step > 1 && (
              <Button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  A criar...
                </>
              ) : step === 3 ? (
                "Criar Conta"
              ) : (
                "Continuar"
              )}
            </Button>
          </div>
        </form>
        <p className="text-center text-text-muted text-sm mt-6">
          Ja tem conta?{" "}
          <Link
            href="/login"
            className="text-primary hover:text-primary-hover font-medium transition-colors"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
