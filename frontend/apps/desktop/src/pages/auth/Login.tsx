import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import logoSrc from "../../assets/logo.png";
import { CustomizablePin } from "../../ui";
import * as Lucide from "lucide-react";
import { useAuth, useOnlineStatus } from "../../hooks";
import type { Account } from "../../types";

export default function Login() {
  const navigate = useNavigate();
  const { pinLogin, accounts, isAuthenticated, fetchAccounts } = useAuth();
  const [accountsLoaded, setAccountsLoaded] = useState(accounts.length > 0);

  useEffect(() => {
    if (accounts.length === 0 && !accountsLoaded) {
      fetchAccounts().then((fetched) => {
        setAccountsLoaded(true);
        if (fetched.length === 0) {
          navigate("/signup?hasAccounts=false", { replace: true });
        }
      }).catch(() => {
        setAccountsLoaded(true);
      });
    }
  }, []);

  // If accounts were already loaded (from App.tsx) and empty, redirect
  useEffect(() => {
    if (accountsLoaded && accounts.length === 0) {
      navigate("/signup?hasAccounts=false", { replace: true });
    }
  }, [accountsLoaded, accounts, navigate]);
  const [selectedId, setSelectedId] = useState<number | null>(() => {
    const remembered = localStorage.getItem("remembered_account");
    if (remembered && isAuthenticated) {
      const match = accounts.find((a) => a.email === remembered);
      return match ? match.id : null;
    }
    return null;
  });
  const [pin, setPin] = useState("");
  const [remember, setRemember] = useState(!!localStorage.getItem("remembered_account"));
  const pinRef = useRef<HTMLDivElement>(null);
  const { isOnline, checked } = useOnlineStatus();
  const [pinError, setPinError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAccountClick = (id: number) => {
    setPinError(false);
    if (selectedId === id) {
      setSelectedId(null);
      setPin("");
      return;
    }
    setSelectedId(id);
    setPin("");
  };

  const handlePinLogin = async (account: Account) => {
    if (!pin) return;
    setPinError(false);
    setLoading(true);
    try {
      await pinLogin(account.email, pin);
      localStorage.setItem("remembered_account", account.email);
      navigate("/panel");
    } catch {
      setPinError(true);
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

          <p className="text-base text-text-muted mb-2 text-left">Selecione a conta</p>

          <div className="w-full">
            {accounts.map((account, i) => {
              const isOpen = selectedId === account.id;
              return (
                <div key={account.id}>
                  <button
                    onClick={() => handleAccountClick(account.id)}
                    className={`w-full flex items-center gap-3 px-0 py-3 bg-transparent text-text hover:opacity-70 transition-opacity text-left ${i < accounts.length - 1 && !isOpen ? "" : ""}`}
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                      {account.first_name.charAt(0).toUpperCase()}
                      {account.last_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">
                        {account.first_name} {account.last_name}
                      </p>
                      <p className="text-xs text-text-muted truncate">{account.email}</p>
                    </div>
                    <Lucide.ChevronDown
                      size={18}
                      className={`text-text-muted transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-400 ease-in-out ${
                      isOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div ref={pinRef} className="pb-5 pt-1 pl-12 pr-0">
                      <div className="space-y-3">
                        <CustomizablePin
                          onChange={setPin}
                          error={pinError}
                          pinClass="h-12 w-full bg-transparent border-0 border-b-2 border-border rounded-none text-center text-text text-base font-bold focus:border-primary focus:ring-0 focus:outline-none transition-colors caret-primary"
                        />

                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={remember}
                              onChange={(e) => setRemember(e.target.checked)}
                              className="w-3.5 h-3.5 rounded border-border bg-transparent accent-primary"
                            />
                            <span className="text-xs text-text-muted">Lembrar</span>
                          </label>

                          <button
                            onClick={() => handlePinLogin(account)}
                            disabled={loading || !pin}
                            className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white hover:brightness-110 active:scale-95 transition-all disabled:opacity-40"
                          >
                            {loading ? (
                              <Lucide.Loader size={16} className="animate-spin" />
                            ) : (
                              <Lucide.ArrowRight size={18} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {i < accounts.length - 1 && <div className="h-px bg-border" />}
                </div>
              );
            })}
          </div>

          <div className="mt-10 text-center flex flex-col items-center justify-center gap-2">
            <p className="text-base text-text-muted">
              Não tem conta?{" "}
              <Link to="/signup?hasAccounts=true" className="text-primary font-bold hover:underline ml-1">
                Criar Conta
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
