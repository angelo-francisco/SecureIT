import { useState } from "react";
import { Key, Loader, Check, X, ArrowLeft }from "lucide-react";
import { useLicense } from "../../hooks/useLicense";
import { licenseApi } from "../../api-client/license";
import { useAuthStore } from "../../hooks";
import { useToast } from "@/packages/ui";
import { useNavigate } from "react-router-dom";

interface LicensePageProps {
  onClose?: () => void;
}

export default function LicensePage({ onClose }: LicensePageProps) {
  const {
    hasLicense,
    type,
    activatedAt,
    expiresAt,
    daysRemaining,
    isActive,
    setLicense,
  } = useLicense();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate()
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleActivate = async () => {
    if (!key || !user?.email || !user?.id) return;
    setLoading(true);

    try {
      const { fingerprint } = await licenseApi.getFingerprint();

      const activateResult = await licenseApi.activate({
        key: key.toUpperCase(),
        email: user.email,
        hardwareFp: fingerprint,
      });

      if (!activateResult.valid) {
        throw new Error(activateResult.error || "Licença inválida");
      }

      const storeResult = await licenseApi.storeLocal({
        license_id: activateResult.licenseId,
        user_id: user.id,
        license_key: key.toUpperCase(),
        license_type: activateResult.type,
        activated_at: activateResult.activatedAt,
        expires_at: activateResult.expiresAt,
        hardware_fingerprint: fingerprint,
        signed_payload: activateResult.signedPayload,
        public_key: activateResult.publicKey,
        signature: "web-signed",
        max_cameras: activateResult.maxCameras,
        max_people: activateResult.maxPeople,
        features: activateResult.features,
        status: "ACTIVE",
      });

      if (!storeResult.success) {
        throw new Error("Erro ao guardar licença localmente");
      }

      setLicense({
        licenseId: storeResult.license_id,
        key: key.toUpperCase(),
        type: activateResult.type,
        activatedAt: activateResult.activatedAt,
        expiresAt: activateResult.expiresAt,
        lastChecked: new Date().toISOString(),
        lastValidatedAt: new Date().toISOString(),
        maxCameras: activateResult.maxCameras,
        maxPeople: activateResult.maxPeople,
        features: activateResult.features,
        signedPayload: activateResult.signedPayload,
        publicKey: activateResult.publicKey,
      });

      toast("Licença activada com sucesso!", "success");
      setKey("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao activar licença";
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
    <div className="min-h-screen bg-bg flex items-center justify-center">
      {onClose && (
        <button
          onClick={onClose}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-gray-400 hover:text-white transition-all duration-150"
        >
          <X size={16} strokeWidth={2} />
        </button>
      )}

      <div className="flex-1 overflow-y-auto flex justify-center">
        {hasLicense && isActive ? (
          <div className="w-full max-w-md space-y-6">
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check size={20} className="text-green-400" />
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
            <div className="text-center mb-8">
              <Key size={48} className="text-primary mx-auto mb-4" />
              <p className="text-text text-lg md:text-2xl font-semibold">
                Nenhuma licença activa.</p>
              <p className="text-text-muted text-base md:text-xl">
                Insira o seu código de licença para
                activar o serviço.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(formatKeyInput(e.target.value))}
                  placeholder="SEC-XXXX-XXXX-XXXX"
                  maxLength={19}
                  className="w-full h-14 px-4 bg-transparent border-0 border-b-2 border-white/[0.08] rounded-none text-center text-white text-lg font-bold focus:border-primary focus:ring-0 focus:outline-none transition-colors caret-primary tracking-widest"
                />
              </div>

              <div className="flex items-center justify-center w-full gap-1.5">
                <button
                onClick={() => {
                  navigate("/profiles")
                }}
                className="cursor-pointer px-4 py-2.5 border text-sm font-medium text-text-muted hover:text-text hover:bg-surface-hover transition-all"
              >
                <ArrowLeft />
              </button>
              <button
                onClick={handleActivate}
                disabled={loading || key.length < 19}
                className="cursor-pointer w-full bg-primary text-text py-3 font-bold hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 transition-colors"
              >
                {loading && (<Loader size={18} className="animate-spin" />)}
                Activar Licença
              </button>
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
