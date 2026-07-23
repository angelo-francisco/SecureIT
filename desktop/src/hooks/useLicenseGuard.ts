import { useState, useEffect } from "react";
import { licenseApi } from "../api-client/license";

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

export function useLicenseGuard(userId: string | null) {
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
  }, [userId]);

  return { status, licenseInfo };
}
