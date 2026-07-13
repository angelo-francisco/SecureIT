import { useState } from "react";
import * as Lucide from "lucide-react";
import { useLicense } from "../../hooks/useLicense";
import { licenseApi } from "../../api-client/license";
import { useAuthStore } from "../../hooks";
import { useToast } from "../../hooks/useToast";

function getMachineHash(): string {
  let hash = localStorage.getItem("machine_hash");
  if (!hash) {
    hash = crypto.randomUUID();
    localStorage.setItem("machine_hash", hash);
  }
  return hash;
}

interface LicensePageProps {
  onClose?: () => void;
}

export default function LicensePage({ onClose }: LicensePageProps) {
  const { hasLicense, type, activatedAt, expiresAt, daysRemaining, isActive, setLicense } =
    useLicense();
  const user = useAuthStore((s) => s.user);
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleActivate = async () => {
    if (!key || !user?.email) return;
    setLoading(true);
    setError("");

    try {
      const result = await licenseApi.activate({
        key: key.toUpperCase(),
        email: user.email,
        machineHash: getMachineHash(),
      });

      if (!result.valid) {
        throw new Error(result.error || "Licença inválida");
      }

      setLicense({
        licenseId: result.licenseId,
        key: key.toUpperCase(),
        type: result.type,
        activatedAt: result.activatedAt,
        expiresAt: result.expiresAt,
        lastChecked: new Date().toISOString(),
      });

      toast("Licença activada com sucesso!", "success");
      setKey("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao activar licença";
      setError(message);
      toast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const formatKeyInput = (value: string) => {
    const cleaned = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    const parts: string[] = [];
    if (cleaned.length > 0) parts.push(cleaned.slice(0, 3));
    if (cleaned.length > 3) parts.push(cleaned.slice(3, 7));
    if (cleaned.length > 7) parts.push(cleaned.slice(7, 11));
    if (cleaned.length > 11) parts.push(cleaned.slice(11, 15));
    if (cleaned.length > 15) parts.push(cleaned.slice(15, 19));
    return parts.join("-");
  };

  return (
    <div className="flex-1 h-full flex flex-col relative overflow-hidden">
      <header className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Lucide.Key size={22} className="text-primary" />
          <h2 className="text-xl font-bold text-text">Licença</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-gray-400 hover:text-white transition-all duration-150"
          >
            <Lucide.X size={16} strokeWidth={2} />
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto mt-6 flex justify-center">
        {hasLicense && isActive ? (
          <div className="w-full max-w-md space-y-6">
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Lucide.Check size={20} className="text-green-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">Licença Activa</p>
                  <p className="text-gray-400 text-sm">
                    {type === "TRIAL" ? "Trial" : "Standard"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Activada em</span>
                  <span className="text-white text-sm">
                    {activatedAt
                      ? new Date(activatedAt).toLocaleDateString("pt-BR")
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Expira em</span>
                  <span className="text-white text-sm">
                    {expiresAt
                      ? new Date(expiresAt).toLocaleDateString("pt-BR")
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Dias restantes</span>
                  <span className="text-white text-sm font-semibold">
                    {daysRemaining}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (daysRemaining / (type === "TRIAL" ? 14 : 30)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <p className="text-gray-400 text-xs">
                A licença é verificada automaticamente a cada 6 horas. Se faltam
                3 dias ou menos, receberá um aviso diário.
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md space-y-6">
            <div className="text-center py-8">
              <Lucide.Key size={48} className="text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">
                Nenhuma licença activa. Insira o seu código de licença para
                activar o serviço.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs tracking-widest text-gray-400 flex items-center gap-2 uppercase mb-2">
                  <Lucide.Key size={14} />
                  Código de Licença
                </label>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(formatKeyInput(e.target.value))}
                  placeholder="SEC-XXXX-XXXX-XXXX"
                  maxLength={19}
                  className="w-full h-14 px-4 bg-transparent border-0 border-b-2 border-white/[0.08] rounded-none text-center text-white text-lg font-bold focus:border-primary focus:ring-0 focus:outline-none transition-colors caret-primary tracking-widest"
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}

              <button
                onClick={handleActivate}
                disabled={loading || key.length < 19}
                className="w-full bg-primary text-black py-3 rounded-lg font-semibold hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {loading ? (
                  <Lucide.Loader size={18} className="animate-spin" />
                ) : (
                  <>
                    <Lucide.Check size={18} />
                    Activar Licença
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
