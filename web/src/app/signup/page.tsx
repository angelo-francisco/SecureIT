"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FloatingLabelInput } from "@/components/FloatingLabelInput";
import { OutlinedInput } from "@/components/OutlinedInput";
import { MaterialPhoneInput } from "@/components/MaterialPhoneInput";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader, UserPlus } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/components/ToastProvider";

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordsError, setPasswordsError] = useState(false);

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

  const handleStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(4);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordsError(false);

    if (password.length < 12) {
      setPasswordsError(true);
      toast("Palavra-passe deve ter pelo menos 12 caracteres");
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
      router.push("/my-account");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao criar conta");
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
            <Image src="/logo.png" alt="SecureIT" width={25} loading="eager" fetchPriority="high" height={25} className="h-8 w-auto" />
            <h1 className="text-2xl font-bold leading-10 text-text tracking-tight">
              SecureIT
            </h1>
          </div>
        </Link>
        <ThemeToggle />
      </div>
      <div className="p-10 flex flex-col items-center w-full max-w-[480px]">
        <div className="w-full flex flex-col items-center">
          <div className="flex flex-col items-center justify-center gap-1 mb-8">
            <h1 className="text-center text-3xl font-semibold">Criar Conta</h1>
            <p className="text-text-muted">Insira os seus dados abaixo para continuar</p>
          </div>

          <form
            className="w-full space-y-6"
            onSubmit={
              step === 1 ? handleStep1 : step === 2 ? handleStep2 : step === 3 ? handleStep3 : handleSignup
            }
          >
            {step === 1 && (
              <>
                <div className="space-y-5">
                  <FloatingLabelInput
                    id="email"
                    label="Endereço de e-mail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!email || loading}
                  className="w-full bg-primary text-white text-lg font-medium py-3.5 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  Avançar
                </button>
                <div className="text-center pt-2">
                  <p className="text-sm text-text-muted">
                    Já tem conta?{" "}
                    <Link
                      href="/login"
                      className="text-primary font-bold hover:underline"
                    >
                      Entrar
                    </Link>
                  </p>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-5">
                  <div className="flex gap-3">
                    <OutlinedInput
                      id="firstName"
                      label="Primeiro Nome"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                    <OutlinedInput
                      id="lastName"
                      label="Último Nome"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-28 shrink-0 border border-border rounded-lg py-3.5 text-text-muted hover:text-text hover:border-text-muted transition-all flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft size={16} />
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={!firstName || !lastName || loading}
                    className="flex-1 bg-primary text-white text-lg font-medium py-3.5 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    Avançar
                  </button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="space-y-5">
                  <MaterialPhoneInput
                    value={phone}
                    onChange={(v) => setPhone(v ?? "")}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-28 shrink-0 border border-border rounded-lg py-3.5 text-text-muted hover:text-text hover:border-text-muted transition-all flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft size={16} />
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary text-white text-lg font-medium py-3.5 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    Avançar
                  </button>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <div className="space-y-5">
                  <div className="relative">
                    <FloatingLabelInput
                      id="password"
                      label="Palavra-passe"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setPasswordsError(false); }}
                      error={passwordsError}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-text-muted">
                    Use palavras-passe com no mínimo de 12 caracteres
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="w-28 shrink-0 border border-border rounded-lg py-3.5 text-text-muted hover:text-text hover:border-text-muted transition-all flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft size={16} />
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={!password || loading}
                    className="flex-1 bg-primary text-white text-lg font-medium py-3.5 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader size={18} className="animate-spin" />
                    ) : (
                      <>
                        Avançar
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
