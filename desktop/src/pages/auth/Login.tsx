import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FloatingLabelInput } from "../../ui";
import * as Lucide from "lucide-react";
import { useAuth } from "../../hooks";
import { useToast } from "../../hooks/useToast";

type LoginStep = "email" | "password";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg text-text">
      <div className="p-10 flex flex-col items-center w-full max-w-[480px]">
        <div className="w-full flex flex-col">
          <div className="mb-12 text-center">
            <div className="flex items-center justify-center gap-1">
              <img src={"logo.png"} alt="SecureIT" className="h-16" />
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
              <FloatingLabelInput
                id="email"
                label="Endereço de E-mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                type="submit"
                disabled={!email}
                className="w-full bg-primary text-white text-lg font-semibold py-4 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                Avançar
              </button>
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
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
