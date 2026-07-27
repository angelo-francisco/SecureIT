import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLicense } from "../../hooks/useLicense";
import { useLicenseStore } from "../../stores/license";
import { licenseApi, type LocalLicenseResponse } from "../../api-client/license";
import { useAuthStore } from "../../hooks";
import { useToast } from "@/packages/ui";
import { Loader, Modal } from "@/packages/ui";
import { disconnectAll } from "../../lib/websocket";
import * as Lucide from "lucide-react";

interface LicenseSettingsProps {
  onClose?: () => void;
}

export default function LicenseSettings({ onClose }: LicenseSettingsProps) {
  const { setLicense, clearLicense } = useLicense();
  const user = useAuthStore((s) => s.user);
  const clearProfile = useAuthStore((s) => s.clearProfile);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [revoking, setRevoking] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [activating, setActivating] = useState(false);
  const [loadingLicense, setLoadingLicense] = useState(true);
  const [apiLicense, setApiLicense] = useState<LocalLicenseResponse | null>(null);
  const [verifying, setVerifying] = useState(false);

  const fetchLicense = useCallback(async () => {
    if (!user?.id) return;
    setLoadingLicense(true);
    try {
      const result = await licenseApi.getCurrent(user.id);
      setApiLicense(result);

      if (result.exists && result.license_id) {
        setLicense({
          licenseId: result.license_id,
          key: result.license_key ?? null,
          type: (result.license_type as "B2C" | "B2B") ?? null,
          activatedAt: result.activated_at ?? null,
          expiresAt: result.expires_at ?? null,
          lastChecked: new Date().toISOString(),
          lastValidatedAt: result.last_validated_at ?? null,
          maxCameras: result.max_cameras ?? -1,
          maxPeople: result.max_people ?? -1,
          features: result.features ?? [],
          signedPayload: null,
          publicKey: null,
        });
      } else {
        clearLicense();
      }
    } catch {
    } finally {
      setLoadingLicense(false);
    }
  }, [user?.id, setLicense, clearLicense]);

  useEffect(() => {
    fetchLicense();
  }, [fetchLicense]);

  const handleVerify = async () => {
    if (!user?.id) return;
    setVerifying(true);
    try {
      const result = await licenseApi.verifyOnline({
        user_id: user.id,
      });

      if (result.reason === "revoked") {
        clearLicense();
        setApiLicense({ exists: false });
        toast("Licença revogada. Contacte o suporte.", "error");
        return;
      }

      if (!result.valid) {
        clearLicense();
        setApiLicense({ exists: false });
        toast(result.reason || "Licença inválida ou expirada.", "error");
        return;
      }

      useLicenseStore.getState().updateLastChecked();

      setApiLicense((prev) =>
        prev
          ? {
              ...prev,
              last_validated_at: result.last_validated_at ?? new Date().toISOString(),
              days_remaining: result.days_remaining,
            }
          : prev,
      );

      toast("Licença verificada com sucesso!", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao verificar licença", "error");
    } finally {
      setVerifying(false);
    }
  };

  const hasLicense = apiLicense?.exists === true;
  const isActive = hasLicense && (apiLicense?.days_remaining ?? 0) > 0;

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

  const handleRevoke = async () => {
    if (!user?.id) return;
    setRevoking(true);
    try {
      await licenseApi.revoke();
      await licenseApi.clearLocal(user.id);
      clearLicense();
      setApiLicense({ exists: false });
      disconnectAll();
      clearProfile();
      toast("Licença revogada com sucesso!", "success");
      setConfirmRevoke(false);
      navigate("/profiles", { replace: true });
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Erro ao revogar licença",
        "error",
      );
    } finally {
      setRevoking(false);
    }
  };

  const handleActivate = async () => {
    if (!newKey || !user?.email || !user?.id) return;
    setActivating(true);
    try {
      const { fingerprint } = await licenseApi.getFingerprint();

      const activateResult = await licenseApi.activate({
        key: newKey.toUpperCase(),
        email: user.email,
        hardwareFp: fingerprint,
      });

      if (!activateResult.valid) {
        throw new Error(activateResult.error || "Licença inválida");
      }

      const storeResult = await licenseApi.storeLocal({
        license_id: activateResult.licenseId,
        user_id: user.id,
        license_key: newKey.toUpperCase(),
        license_type: activateResult.type,
        activated_at: activateResult.activatedAt,
        expires_at: activateResult.expiresAt,
        hardware_fingerprint: fingerprint,
        signed_payload: activateResult.signedPayload || "",
        public_key: activateResult.publicKey || "",
        signature: "web-signed",
        max_cameras: activateResult.maxCameras ?? -1,
        max_people: activateResult.maxPeople ?? -1,
        features: activateResult.features ?? [],
        status: "ACTIVE",
      });

      if (!storeResult.success) {
        throw new Error("Erro ao guardar licença localmente");
      }

      setLicense({
        licenseId: activateResult.licenseId,
        key: newKey.toUpperCase(),
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

      setApiLicense({
        exists: true,
        license_id: activateResult.licenseId,
        license_key: newKey.toUpperCase(),
        license_type: activateResult.type,
        activated_at: activateResult.activatedAt,
        expires_at: activateResult.expiresAt,
        last_validated_at: new Date().toISOString(),
        max_cameras: activateResult.maxCameras,
        max_people: activateResult.maxPeople,
        features: activateResult.features,
        status: "ACTIVE",
        days_remaining: activateResult.daysRemaining,
      });

      setNewKey("");
      toast("Licença activada com sucesso!", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao activar licença", "error");
    } finally {
      setActivating(false);
    }
  };

  if (loadingLicense) {
    return (
      <div className="flex-1 flex items-center justify-center py-8">
        <Loader w={32} />
      </div>
    );
  }

  if (!hasLicense) {
    return (
      <div className="flex-1 flex flex-col items-center gap-6 py-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 bg-white/[0.04] flex items-center justify-center">
            <Lucide.Key size={28} className="text-text-muted" />
          </div>
          <div className="flex flex-col gap-1 max-w-md text-center">
            <h3 className="text-text font-semibold text-base">
              Nenhuma licença activa
            </h3>
            <p className="text-text-muted text-sm leading-relaxed">
              Insira uma chave de licença para activar o serviço
            </p>
          </div>
        </div>

        <div className="w-full max-w-sm space-y-3">
          <input
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(formatKeyInput(e.target.value))}
            onPaste={(e) => {
              e.preventDefault();
              const pasted = e.clipboardData.getData("text");
              setNewKey(formatKeyInput(pasted));
            }}
            placeholder="SEC-XXXX-XXXX-XXXX"
            maxLength={19}
            className="w-full h-12 px-4 bg-transparent border-0 border-b-2 border-white/[0.08] text-center text-white text-sm font-bold focus:border-primary focus:ring-0 focus:outline-none transition-colors caret-primary tracking-widest"
          />
          <button
            onClick={handleActivate}
            disabled={activating || newKey.length < 19}
            className="w-full py-2.5 text-sm font-medium text-white bg-primary hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {activating && <Loader w={14} />}
            Activar Licença
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-2">
          <div className="px-6 py-6 border border-border">
            <div className="w-full flex flex-col md:flex-row items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-text">
                  {apiLicense?.license_type === "B2B" ? "B2B" : "B2C"} [<span
                    className={`px-1 uppercase font-bold ${isActive
                      ? "text-success"
                      : "text-error"
                      }`}
                  >
                    {isActive ? "Activa" : "Expirada"}
                  </span>]
                </h2>

                <p className="mt-1 text-base text-text-muted">
                  Licença profissional SecureIT
                </p>
              </div>
              <div className="flex gap-2 items-center justify-end">
                <button
                  onClick={handleVerify}
                  disabled={verifying}
                  className="px-3 py-3 text-base font-bold text-text border
                   border-white/[0.08] transition-colors
                    flex items-center justify-center gap-2 disabled:opacity-40
                     cursor-pointer w-full bg-primary"
                >
                  {verifying ? (
                    <Loader w={16} />
                  ) : (
                    <Lucide.RefreshCw size={16} />
                  )}
                  {verifying ? "A verificar..." : "Verificar"}
                </button>
                {isActive && (
                  <button
                    onClick={() => setConfirmRevoke(true)}
                    className="
                      w-full
                      py-3
                      px-3
                      text-base
                      font-bold
                      uppercase
                      bg-error
                      text-white
                      cursor-pointer
                    "
                  >
                    Revogar
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 px-6 py-6 border border-border">
            <p className="text-lg uppercase font-bold">
              Detalhes
            </p>

            <div className="divide-y divide-white/[0.06]">
              <div className="py-2.5 flex justify-between">
                <span className="text-base text-text-muted">
                  Activada em
                </span>

                <span className="text-base text-text font-semibold">
                  {apiLicense?.activated_at
                    ? new Date(apiLicense.activated_at)
                      .toLocaleDateString("pt-PT")
                    : "—"}
                </span>
              </div>

              <div className="py-2.5 flex justify-between">
                <span className="text-base text-text-muted">
                  Expira em
                </span>

                <span className="text-base text-text font-semibold">
                  {apiLicense?.expires_at
                    ? new Date(apiLicense.expires_at)
                      .toLocaleDateString("pt-PT")
                    : "—"}
                </span>
              </div>

              <div className="py-2.5 flex justify-between">
                <span className="text-base text-text-muted">
                  Dias restantes
                </span>

                <span className="text-base text-text font-bold">
                  {apiLicense?.days_remaining ?? 0} dias
                </span>
              </div>

              <div className="py-2.5 flex justify-between">
                <span className="text-base text-text-muted">
                  Tipo
                </span>

                <span className="text-base text-text font-bold">
                  {apiLicense?.license_type}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 px-6 py-6 border border-border">
            <p className="text-lg font-bold uppercase">
              Recursos
            </p>

            <div className="divide-y divide-white/[0.06]">
              <div className="py-2.5 flex justify-between">
                <span className="text-base text-text-muted">
                  Máximo de câmaras
                </span>

                <span className="text-base font-semibold text-text">
                  {apiLicense?.max_cameras === -1 ? "Ilimitadas" : "—"}
                </span>
              </div>


              <div className="py-2.5 flex justify-between">
                <span className="text-base text-text-muted">
                  Máximo de pessoas
                </span>

                <span className="text-base font-semibold text-text">
                  {apiLicense?.max_people === -1 ? "Ilimitadas" : "—"}
                </span>
              </div>


              <div className="py-2.5 flex justify-between">
                <span className="text-base text-text-muted">
                  Funcionalidades
                </span>

                <span className="text-base font-semibold text-text text-right max-w-[250px]">
                  {apiLicense?.features?.length
                    ? apiLicense.features.join(", ")
                    : "—"}
                </span>
              </div>

            </div>

          </div>

          <div className="mt-3 px-6 py-6 border border-border">
            <p className="text-lg uppercase font-bold">
              Segurança
            </p>


            <div className="divide-y divide-white/[0.06]">

              <div className="py-2.5 flex justify-between">
                <span className="text-base text-text-muted">
                  Última validação
                </span>

                <span className="text-base text-text font-medium">
                  {apiLicense?.last_validated_at
                    ? new Date(apiLicense.last_validated_at)
                      .toLocaleString("pt-PT")
                    : "—"}
                </span>
              </div>


              <div className="py-2.5 flex justify-between">
                <span className="text-base text-text-muted">
                  Estado servidor
                </span>

                <span className="text-base text-success font-bold">
                  Online
                </span>
              </div>

            </div>
          </div>


        </div>
      </div>

      <Modal open={confirmRevoke} onClose={() => setConfirmRevoke(false)}>
        <div className="p-6 max-w-sm bg-bg">

          <div className="flex items-center gap-3 mb-5">

            <div className="p-3 flex items-center justify-center">
              <Lucide.AlertTriangle
                size={30}
                className="text-error"
              />
            </div>

            <div>
              <h3 className="text-xl font-bold text-text">
                Revogar Licença
              </h3>

              <p className="text-base text-text-muted">
                Esta acção não pode ser desfeita
              </p>
            </div>

          </div>


          <p className="text-base text-text-muted mb-6">
            Ao revogar a licença, perderá acesso às funcionalidades
            associadas a este dispositivo.
          </p>


          <div className="flex gap-3">

            <button
              onClick={() => setConfirmRevoke(false)}
              className="
              flex-1
              h-11
              border border-white/[0.08]
              text-base
              text-text-muted
              hover:bg-white/[0.04] cursor-pointer
            "
            >
              Cancelar
            </button>


            <button
              onClick={handleRevoke}
              disabled={revoking}
              className="
              flex-1
              h-11
              bg-error
              text-white
              text-base
              font-semibold
              flex
              items-center
              justify-center
              gap-2
              disabled:opacity-50 cursor-pointer
            "
            >
              {revoking && <Loader w={14} />}
              Revogar
            </button>

          </div>

        </div>
      </Modal>
      <div className="py-2.5 border-white/[0.06]">
        <p className="text-base text-text-muted text-center">
          Verificação automática activa · sincronização a cada 6 horas
        </p>
      </div>
    </>
  );
}
