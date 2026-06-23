import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logoSrc from "../../assets/logo.png";
import bgLoginSrc from "../../assets/bgLogin.png";
import { Input } from "../../ui/components/ui/input";
import * as Lucide from "lucide-react";
import { useAuth } from "../../hooks";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ email, password });
      navigate("/panel");
    } catch {
      setError("Credenciais inválidas. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#031427] text-[#d3e4fe] relative overflow-hidden">
      {/* Background */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgLoginSrc})` }}
      >
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
        {/* Card */}
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
            <div className="mb-10 text-center">
              <img src={logoSrc} alt="SecureIT" className="h-16 mb-6 mx-auto" />
              <h1 className="text-[32px] font-semibold leading-10 text-[#adc7ff] tracking-tight font-display">
                SecureIT
              </h1>
              <p className="text-sm leading-5 tracking-widest uppercase text-[#c1c6d7] mt-1" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                Enterprise Gateway
              </p>
            </div>

            {/* Form */}
            <form className="w-full space-y-6" onSubmit={handleLogin}>
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs tracking-widest text-[#c1c6d7] flex items-center gap-2 uppercase" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                  <Lucide.Mail size={14} />
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#0b1c30] border-[#414754] text-[#d3e4fe] placeholder:text-[#8b90a0] focus:border-[#adc7ff] focus:ring-[#adc7ff]/50 rounded-lg h-12"
                  style={{ boxShadow: "none" }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs tracking-widest text-[#c1c6d7] flex items-center gap-2 uppercase" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                  <Lucide.Lock size={14} />
                  Secure Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-[#0b1c30] border-[#414754] text-[#d3e4fe] placeholder:text-[#8b90a0] focus:border-[#adc7ff] focus:ring-[#adc7ff]/50 rounded-lg h-12 pr-12"
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

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-[#414754] bg-[#0b1c30] text-[#adc7ff] focus:ring-[#adc7ff]/50 transition-all"
                  />
                  <span className="text-xs tracking-widest text-[#c1c6d7] group-hover:text-[#d3e4fe] transition-colors" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                    Remember Device
                  </span>
                </label>
                <a href="#" className="text-xs tracking-widest text-[#adc7ff] hover:underline" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                  Forgot Access?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#adc7ff] text-[#002e68] text-lg font-semibold py-4 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                style={{ boxShadow: "0 0 20px rgba(173, 199, 255, 0.15)" }}
              >
                <Lucide.LogIn size={20} />
                {loading ? "A autenticar..." : "Authenticate"}
              </button>
            </form>

            {/* Divider */}
            <div className="w-full flex items-center gap-4 my-8">
              <div className="h-px flex-1 bg-[#414754]" />
              <span className="text-xs tracking-widest text-[#414754]" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                OU CONTINUE COM
              </span>
              <div className="h-px flex-1 bg-[#414754]" />
            </div>

            {/* Social */}
            <div className="w-full grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-3 bg-[#1b2b3f] border border-[#414754] rounded-lg py-3 hover:bg-[#26364a] transition-colors active:scale-95">
                <span className="text-xs tracking-widest">Google</span>
              </button>
              <button className="flex items-center justify-center gap-3 bg-[#1b2b3f] border border-[#414754] rounded-lg py-3 hover:bg-[#26364a] transition-colors active:scale-95">
                <span className="text-xs tracking-widest">Apple</span>
              </button>
            </div>

            {/* Footer */}
            <div className="mt-10 text-center">
              <p className="text-base text-[#c1c6d7]">
                Não tem conta?{" "}
                <Link to="/signup" className="text-[#adc7ff] font-bold hover:underline ml-1">
                  Criar Conta
                </Link>
              </p>
            </div>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}
