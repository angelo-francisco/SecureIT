"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FloatingLabelInput } from "@/components/FloatingLabelInput";
import { ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStep(2);
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName) return;
    setStep(3);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("As palavras-passe não coincidem");
      return;
    }

    if (password.length < 12) {
      setError("Palavra-passe deve ter pelo menos 12 caracteres");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          phone: phone || undefined,
          password,
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
    <div className="min-h-screen flex items-center justify-center bg-bg text-text">
      <div className="p-10 flex flex-col items-center w-full max-w-[480px]">
        <div className="w-full flex flex-col items-center">
          <div className="mb-10 text-center">
            <div className="flex items-center justify-center gap-1">
              <Image src="/logo.png" alt="SecureIT" width={64} height={64} className="h-16 w-auto" />
              <h1 className="text-5xl font-display font-bold leading-10 text-text tracking-tight">
                SecureIT
              </h1>
            </div>
            <p className="text-xl text-text mt-1">
              A segurança mais próximo de si.
            </p>
          </div>

          <form
            className="w-full space-y-6"
            onSubmit={
              step === 1 ? handleStep1 : step === 2 ? handleStep2 : handleSignup
            }
          >
            {error && (
              <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm text-center">
                {error}
              </div>
            )}

            {step === 1 && (
              <>
                <div className="space-y-5">
                  <FloatingLabelInput
                    id="email"
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!email}
                  className="w-full bg-primary text-white text-lg font-semibold py-4 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-6"
                >
                  Continuar <ArrowRight size={20} />
                </button>
                <div className="text-center pt-4">
                  <p className="text-base text-text-muted">
                    Já tem conta?{" "}
                    <Link
                      href="/login"
                      className="text-primary font-bold hover:underline ml-1"
                    >
                      Entrar
                    </Link>
                  </p>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors"
                >
                  <ArrowLeft size={16} />
                  Voltar
                </button>
                <div className="space-y-5">
                  <FloatingLabelInput
                    id="firstName"
                    label="Primeiro Nome"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                  <FloatingLabelInput
                    id="lastName"
                    label="Último Nome"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                  <FloatingLabelInput
                    id="phone"
                    label="Telemóvel (opcional)"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!firstName || !lastName}
                  className="w-full bg-primary text-white text-lg font-semibold py-4 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-6"
                >
                  Continuar <ArrowRight size={20} />
                </button>
              </>
            )}

            {step === 3 && (
              <>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors"
                >
                  <ArrowLeft size={16} />
                  Voltar
                </button>
                <div className="space-y-5">
                  <div className="relative">
                    <FloatingLabelInput
                      id="password"
                      label="Palavra-passe"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <FloatingLabelInput
                    id="confirmPassword"
                    label="Confirmar Palavra-passe"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <p className="text-xs text-text-muted">
                    Mínimo de 12 caracteres
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={!password || !confirmPassword || loading}
                  className="w-full bg-primary text-white text-lg font-semibold py-4 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-6"
                >
                  {loading ? "A criar..." : "Criar Conta"}
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
