import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OutlinedInput } from "@/packages/ui";
import * as Lucide from "lucide-react";
import { useAuth } from "../../hooks";
import { useToast } from "@/packages/ui";
import { openExternally } from "../../api-client";
import { Navbar } from "@/components/Navbar";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);

    try {
      await login(email, password);
      navigate("/profiles");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao fazer login", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar/>
      <section className="select-none bg-bg relative overflow-hidden min-h-screen flex justify-center items-center">
        <div className="p-5 flex flex-col items-center w-full max-w-[480px]">
          <div className="w-full flex flex-col">
            <div className="flex flex-col items-center justify-center gap-1 mb-6">
              <h1 className="text-center text-5xl font-semibold text-text">Iniciar Sessão</h1>
              <p className="text-text-muted text-xl text-text">Insira os seus dados abaixo para continuar</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-8">
              <div className="space-y-4">
                <OutlinedInput
                  id="email"
                  label="Endereço de E-mail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Lucide.Mail />}
                  labelSize="xl"
                />
                <OutlinedInput
                  id="password"
                  label="Palavra-passe"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lucide.Lock />}
                  labelSize="xl"
                />
              </div>
              <button
                type="submit"
                disabled={!email || !password || loading}
                className="cursor-pointer mt-5 w-full bg-primary text-white text-lg font-medium py-3 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Lucide.Loader size={18} className="animate-spin" />
                ) : (
                  <>Avançar</>
                )}
              </button>
              <div className="text-center pt-1">
                <p className="text-lg text-text-muted">
                  Não tem conta?{" "}
                  <button
                    type="button"
                    onClick={async () => await openExternally('signup')}
                    className="text-primary font-bold hover:underline ml-1 cursor-pointer"
                  >
                    Criar Conta
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
