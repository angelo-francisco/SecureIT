"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
      setError("As palavras-passe não coincidem");
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

      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar conta");
      }

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
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-white">
            SecureIT
          </h1>
          <p className="text-gray-400 mt-2">Crie a sua conta</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 space-y-6"
        >
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {step === 1 && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#22D3EE] transition-colors"
                placeholder="seu@email.com"
                required
              />
            </div>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Primeiro Nome
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#22D3EE] transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Último Nome
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#22D3EE] transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Telemóvel (opcional)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#22D3EE] transition-colors"
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Palavra-passe
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#22D3EE] transition-colors"
                  placeholder="Mínimo 12 caracteres"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Confirmar Palavra-passe
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#22D3EE] transition-colors"
                  required
                />
              </div>
            </>
          )}

          <div className="flex gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="flex-1 border border-white/10 text-white py-3 rounded-lg font-semibold hover:bg-white/5 transition-all"
              >
                Voltar
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#22D3EE] text-black py-3 rounded-lg font-semibold hover:brightness-110 transition-all disabled:opacity-50"
            >
              {loading
                ? "A criar..."
                : step === 3
                  ? "Criar Conta"
                  : "Continuar"}
            </button>
          </div>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Já tem conta?{" "}
          <Link href="/login" className="text-[#22D3EE] hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
