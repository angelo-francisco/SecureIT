import { useState, useEffect } from "react";
import { licenseApi } from "../api-client/license";
import { useLicenseStore } from "../stores/license";

export type LicenseGuardStatus =
  | "loading"
  | "valid"
  | "no_license"
  | "expired"
  | "revoked"
  | "stale"
  | "fingerprint_mismatch"
  | "invalid_signature"
  | "error";

export function useLicenseGuard(userId: string | null, recheckKey: number = 0) {
  const [status, setStatus] = useState<LicenseGuardStatus>("loading");
  const [licenseInfo, setLicenseInfo] = useState<any>(null);

  useEffect(() => {
    if (!userId) {
      setStatus("no_license");
      return;
    }

    let cancelled = false;

    const check = async () => {
      try {
        const { fingerprint } = await licenseApi.getFingerprint();

        const result = await licenseApi.verifyLocal({
          user_id: userId,
          hardware_fingerprint: fingerprint,
        });

        if (cancelled) return;

        if (result.valid) {
          setStatus("valid");
          setLicenseInfo(result);

          useLicenseStore.getState().setLicense({
            licenseId: result.license_id,
            key: result.license_key,
            type: result.license_type as "B2C" | "B2B",
            activatedAt: result.activated_at,
            expiresAt: result.expires_at,
            lastChecked: new Date().toISOString(),
            lastValidatedAt: result.last_validated_at,
            maxCameras: result.max_cameras,
            maxPeople: result.max_people,
            features: result.features,
            signedPayload: null,
            publicKey: null,
          });
        } else {
          setStatus((result.reason as LicenseGuardStatus) || "error");
          setLicenseInfo(result);
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    };

    check();

    return () => {
      cancelled = true;
    };
  }, [userId, recheckKey]);

  return { status, licenseInfo };
}
