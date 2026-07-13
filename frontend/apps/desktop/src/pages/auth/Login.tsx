import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logoSrc from "../../assets/logo.png";
import { FloatingLabelInput } from "../../ui";
import * as Lucide from "lucide-react";
import { useAuth } from "../../hooks";
import { useToast } from "../../hooks/useToast";

type LoginMethod = "password" | "email-code" | "totp";
type LoginStep = "email" | "password" | "email-code-sent" | "email-code-verify" | "totp-verify";

export default function Login() {
  const navigate = useNavigate();
  const { login, sendEmailCode, verifyEmailCode, verifyTOTP } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<LoginStep>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [totpCode, setTotpCode] = useState("");
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
      await login(email, password);
      navigate("/panel");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao fazer login";
      setError(message);
      toast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmailCode = async (method: LoginMethod) => {
    if (method === "email-code") {
      setLoading(true);
      try {
        await sendEmailCode(email);
        setStep("email-code-sent");
        toast("Código enviado para o seu email", "success");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao enviar código";
        setError(message);
        toast(message, "error");
      } finally {
        setLoading(false);
      }
    } else if (method === "totp") {
      setStep("totp-verify");
    }
  };

  const handleEmailCodeVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailCode.length !== 6) return;
    setLoading(true);
    setError("");

    try {
      await verifyEmailCode(email, emailCode);
      navigate("/panel");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Código inválido";
      setError(message);
      toast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleTOTPVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.length !== 6) return;
    setLoading(true);
    setError("");

    try {
      await verifyTOTP(totpCode);
      navigate("/panel");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Código inválido";
      setError(message);
      toast(message, "error");
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
              <img src={logoSrc} alt="SecureIT" className="h-16" />
              <h1 className="text-5xl font-display font-bold leading-10 text-text tracking-tight">
                SecureIT
              </h1>
            </div>
            <p className="text-xl text-text mt-1">
              A segurança mais próximo de si.
            </p>
          </div>

          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <p className="text-base text-text-muted mb-2 text-left">
                Insira o seu email
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
                Continuar <Lucide.ArrowRight size={20} />
              </button>
              <div className="text-center pt-4">
                <p className="text-base text-text-muted">
                  Não tem conta?{" "}
                  <Link
                    to="/signup"
                    className="text-primary font-bold hover:underline ml-1"
                  >
                    Criar Conta
                  </Link>
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
                <Lucide.ArrowLeft size={16} />
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
                  <Lucide.Lock size={14} />
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
                  <Lucide.Loader size={18} className="animate-spin" />
                ) : (
                  <>
                    Entrar <Lucide.ArrowRight size={18} />
                  </>
                )}
              </button>

              <div className="flex flex-col gap-3 pt-4 border-t border-border">
                <p className="text-xs text-text-muted text-center">
                  Outros métodos de login:
                </p>
                <button
                  type="button"
                  onClick={() => handleSendEmailCode("email-code")}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 py-3 border border-border rounded-lg text-text-muted hover:text-text hover:bg-white/[0.03] transition-all text-sm"
                >
                  <Lucide.Mail size={16} />
                  Código por Email
                </button>
                <button
                  type="button"
                  onClick={() => handleSendEmailCode("totp")}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 py-3 border border-border rounded-lg text-text-muted hover:text-text hover:bg-white/[0.03] transition-all text-sm"
                >
                  <Lucide.Smartphone size={16} />
                  Authenticator App
                </button>
              </div>
            </form>
          )}

          {step === "email-code-sent" && (
            <div className="space-y-6">
              <button
                type="button"
                onClick={() => {
                  setStep("password");
                  setEmailCode("");
                  setError("");
                }}
                className="flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors"
              >
                <Lucide.ArrowLeft size={16} />
                Voltar
              </button>

              <div className="text-center">
                <Lucide.Mail size={48} className="text-primary mx-auto mb-4" />
                <p className="text-text font-medium">Código enviado!</p>
                <p className="text-text-muted text-sm mt-1">
                  Verifique o seu email e insira o código de 6 dígitos.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleEmailCodeVerify} className="space-y-4">
                <input
                  type="text"
                  value={emailCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setEmailCode(val);
                  }}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full h-14 px-4 bg-transparent border-0 border-b-2 border-border rounded-none text-center text-text text-2xl font-bold focus:border-primary focus:ring-0 focus:outline-none transition-colors caret-primary tracking-[0.5em]"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={loading || emailCode.length !== 6}
                  className="w-full bg-primary text-white text-lg font-semibold py-4 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <Lucide.Loader size={18} className="animate-spin" />
                  ) : (
                    "Verificar"
                  )}
                </button>
              </form>

              <button
                type="button"
                onClick={() => handleSendEmailCode("email-code")}
                disabled={loading}
                className="w-full text-center text-sm text-text-muted hover:text-text transition-colors"
              >
                Reenviar código
              </button>
            </div>
          )}

          {step === "totp-verify" && (
            <form onSubmit={handleTOTPVerify} className="space-y-6">
              <button
                type="button"
                onClick={() => {
                  setStep("password");
                  setTotpCode("");
                  setError("");
                }}
                className="flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors"
              >
                <Lucide.ArrowLeft size={16} />
                Voltar
              </button>

              <div className="text-center">
                <Lucide.Smartphone size={48} className="text-primary mx-auto mb-4" />
                <p className="text-text font-medium">Authenticator App</p>
                <p className="text-text-muted text-sm mt-1">
                  Insira o código de 6 dígitos do seu aplicativo autenticador.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm text-center">
                  {error}
                </div>
              )}

              <input
                type="text"
                value={totpCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setTotpCode(val);
                }}
                placeholder="000000"
                maxLength={6}
                className="w-full h-14 px-4 bg-transparent border-0 border-b-2 border-border rounded-none text-center text-text text-2xl font-bold focus:border-primary focus:ring-0 focus:outline-none transition-colors caret-primary tracking-[0.5em]"
                autoFocus
              />

              <button
                type="submit"
                disabled={loading || totpCode.length !== 6}
                className="w-full bg-primary text-white text-lg font-semibold py-4 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Lucide.Loader size={18} className="animate-spin" />
                ) : (
                  "Verificar"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
