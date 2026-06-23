import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logoSrc from "../../assets/logo.png";
import bgLoginSrc from "../../assets/bgLogin.png";
import { Input } from "../../ui/components/ui/input";
import { CustomizablePin } from "../../ui";
import * as Lucide from "lucide-react";
import { useAuth } from "../../hooks";

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSendCode = () => {
    if (!email) return;
    setSending(true);
    const c = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedCode(c);
    setCodeSent(true);
    console.log("[EMAIL VERIFICATION] Código enviado para", email, ":", c);
    setTimeout(() => setSending(false), 300);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (code !== generatedCode) {
      setError("Código de verificação inválido.");
      return;
    }
    setLoading(true);
    try {
      await signup({ full_name: `${firstName} ${lastName}`, email, password, pin });
      navigate("/login");
    } catch {
      setError("Erro ao registar. Verifique os dados.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "bg-[#0b1c30] border-[#414754] text-[#d3e4fe] placeholder:text-[#8b90a0] focus:border-[#adc7ff] focus:ring-[#adc7ff]/50 rounded-lg h-12";

  return (
    <div className="min-h-screen bg-[#031427] text-[#d3e4fe] relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <img src={bgLoginSrc} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#031427]/80 via-transparent to-[#031427]/80 z-10" />
      </div>

      {/* Corner accents */}
      <div className="fixed top-8 left-8 z-30 pointer-events-none opacity-20">
        <div className="w-24 h-px bg-[#adc7ff] mb-2" />
        <div className="w-px h-24 bg-[#adc7ff]" />
      </div>
      <div className="fixed bottom-8 right-8 z-30 pointer-events-none opacity-20 rotate-180">
        <div className="w-24 h-px bg-[#adc7ff] mb-2" />
        <div className="w-px h-24 bg-[#adc7ff]" />
      </div>

      <main className="relative z-20 w-full">

        <div className="flex justify-center">
        <div
          className="p-10 flex flex-col items-center w-full max-w-[480px]"
          style={{
            background: "rgba(16, 32, 52, 0.8)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(65, 71, 84, 0.5)",
            boxShadow: "0 0 20px rgba(173, 199, 255, 0.15)",
          }}
        >
          <div className="w-full flex flex-col items-center">
            {/* Brand */}
            <div className="mb-8 text-center">
              <img src={logoSrc} alt="SecureIT" className="h-14 mb-4 mx-auto" />
              <h1 className="text-[28px] font-semibold leading-9 text-[#adc7ff] tracking-tight font-display">
                {step === 1 ? "Criar Conta" : "Segurança"}
              </h1>
              <p className="text-sm leading-5 tracking-widest uppercase text-[#c1c6d7] mt-1" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                {step === 1 ? "Os seus dados pessoais" : "Proteja a sua conta"}
              </p>
            </div>

            <form className="w-full space-y-5" onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleSignup}>
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            {step === 1 && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs tracking-widest text-[#c1c6d7] flex items-center gap-2 uppercase" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                    <Lucide.User size={14} />
                    First Name
                  </label>
                  <Input
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={inputClass}
                    style={{ boxShadow: "none" }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs tracking-widest text-[#c1c6d7] flex items-center gap-2 uppercase" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                    <Lucide.User size={14} />
                    Last Name
                  </label>
                  <Input
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={inputClass}
                    style={{ boxShadow: "none" }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs tracking-widest text-[#c1c6d7] flex items-center gap-2 uppercase" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                    <Lucide.Phone size={14} />
                    Phone
                  </label>
                  <Input
                    type="tel"
                    placeholder="+244 900 000 000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                    style={{ boxShadow: "none" }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!firstName || !lastName || !phone}
                  className="w-full bg-[#adc7ff] text-[#002e68] text-lg font-semibold py-4 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ boxShadow: "0 0 20px rgba(173, 199, 255, 0.15)" }}
                >
                  Continuar <Lucide.ArrowRight size={20} />
                </button>
                <div className="text-center pt-4">
                  <p className="text-base text-[#c1c6d7]">
                    Já tem conta?{" "}
                    <Link to="/login" className="text-[#adc7ff] font-bold hover:underline ml-1">
                      Entrar
                    </Link>
                  </p>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs tracking-widest text-[#c1c6d7] flex items-center gap-2 uppercase" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                    <Lucide.Mail size={14} />
                    Email Address
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={inputClass}
                        style={{ boxShadow: "none" }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSendCode}
                      disabled={!email || sending}
                      className="px-5 py-3 bg-[#1b2b3f] border border-[#414754] rounded-lg text-xs tracking-widest text-[#adc7ff] hover:bg-[#26364a] transition-colors disabled:opacity-50 shrink-0"
                      style={{ fontFamily: "JetBrains Mono, monospace" }}
                    >
                      {sending ? "..." : "Enviar"}
                    </button>
                  </div>
                </div>

                {codeSent && (
                  <div className="p-3 rounded-lg bg-[#adc7ff]/10 border border-[#adc7ff]/20 text-xs text-[#c1c6d7] text-center">
                    Código enviado para <span className="text-[#adc7ff] font-medium">{email}</span> (verifique o console)
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs tracking-widest text-[#c1c6d7] flex items-center gap-2 uppercase" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                    <Lucide.KeyRound size={14} />
                    Verification Code
                  </label>
                  <Input
                    type="text"
                    placeholder="0000"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={4}
                    className={inputClass}
                    style={{ boxShadow: "none" }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs tracking-widest text-[#c1c6d7] flex items-center gap-2 uppercase" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                    <Lucide.Lock size={14} />
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${inputClass} pr-12`}
                      style={{ boxShadow: "none" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#c1c6d7] hover:text-[#adc7ff] transition-colors"
                    >
                      {showPassword ? <Lucide.EyeOff size={18} /> : <Lucide.Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs tracking-widest text-[#c1c6d7] flex items-center gap-2 uppercase" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                    <Lucide.Lock size={14} />
                    PIN Code
                  </label>
                  <CustomizablePin
                    onChange={setPin}
                    pinClass="h-12 w-full rounded-lg border border-[#414754] bg-[#0b1c30] text-center text-[#d3e4fe] text-lg font-bold focus:border-[#adc7ff] focus:ring-2 focus:ring-[#adc7ff]/50 focus:outline-none transition-all caret-[#adc7ff]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!email || !code || !password || !pin || loading}
                  className="w-full bg-[#adc7ff] text-[#002e68] text-lg font-semibold py-4 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ boxShadow: "0 0 20px rgba(173, 199, 255, 0.15)" }}
                >
                  {loading ? "A criar..." : "Criar Conta"} <Lucide.ArrowRight size={20} />
                </button>
              </>
            )}

            {step === 2 && (
              <div className="text-center pt-4">
                <p className="text-base text-[#c1c6d7]">
                  Already have an account?{" "}
                  <Link to="/login" className="text-[#adc7ff] font-bold hover:underline ml-1">
                    Sign in
                  </Link>
                </p>
              </div>
            )}
          </form>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}
