import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logoSrc from "../../assets/logo.png";
import { FloatingLabelInput } from "../../ui";
import { CustomizablePin } from "../../ui";
import * as Lucide from "lucide-react";
import { useAuth, useOnlineStatus } from "../../hooks";

export default function Signup() {
  const navigate = useNavigate();
  const { signup, fetchAccounts } = useAuth();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pin, setPin] = useState("");
  const { isOnline, checked } = useOnlineStatus();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStep(2);
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !phone) return;
    setStep(3);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup({ email, first_name: firstName, last_name: lastName, phone, password, pin });
      // After signup, fetch accounts and go to login so user can enter PIN
      try {
        await fetchAccounts();
      } catch {
        // accounts fetch failed, still navigate
      }
      navigate("/login", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao registar. Verifique os dados.";
      setError(message);
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
              <img src={logoSrc} alt="SecureIT" className="h-16" />
              <h1 className="text-5xl font-display font-bold leading-10 text-text tracking-tight">
                SecureIT
              </h1>
            </div>
            <p className="text-xl text-text mt-1">
              A segurança mais próximo de si.
            </p>
          </div>

          <form className="w-full space-y-6" onSubmit={step === 1 ? handleStep1 : step === 2 ? handleStep2 : handleSignup}>
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
                  Continuar <Lucide.ArrowRight size={20} />
                </button>
                {checked && !isOnline && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Lucide.WifiOff size={14} className="text-text-muted shrink-0" />
                    <p className="text-xs text-text-muted">
                      É necessária uma conexão com a internet para fazer cadastro
                    </p>
                  </div>
                )}
                <div className="text-center pt-4">
                  <p className="text-base text-text-muted">
                    Já tem conta?{" "}
                    <Link to="/login" className="text-primary font-bold hover:underline ml-1">
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
                  <Lucide.ArrowLeft size={16} />
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
                    label="Telemóvel"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!firstName || !lastName || !phone}
                  className="w-full bg-primary text-white text-lg font-semibold py-4 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-6"
                >
                  Continuar <Lucide.ArrowRight size={20} />
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
                  <Lucide.ArrowLeft size={16} />
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
                      {showPassword ? <Lucide.EyeOff size={18} /> : <Lucide.Eye size={18} />}
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs tracking-widest text-text-muted flex items-center gap-2 uppercase">
                      <Lucide.Lock size={14} />
                      PIN
                    </label>
                    <CustomizablePin
                      onChange={setPin}
                      pinClass="h-14 w-full bg-transparent border-0 border-b-2 border-border rounded-none text-center text-text text-lg font-bold focus:border-primary focus:ring-0 focus:outline-none transition-colors caret-primary"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!password || !pin || loading}
                  className="w-full bg-primary text-white text-lg font-semibold py-4 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-6"
                >
                  {loading ? "A criar..." : "Criar Conta"}
                </button>
              </>
            )}
          </form>

          {checked && !isOnline && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Lucide.WifiOff size={14} className="text-text-muted shrink-0" />
              <p className="text-xs text-text-muted">
                É necessária uma conexão com a internet para fazer cadastro
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
