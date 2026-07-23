import { useEffect, useRef } from "react";
import { useLicenseStore } from "../stores/license";
import { licenseApi } from "../api-client/license";
import { useToastStore } from "../stores/toast";

const VALIDATION_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours
const ALERT_THRESHOLD_DAYS = 3;

function wasAlertSentToday(): boolean {
  const lastAlert = localStorage.getItem("license_alert_last");
  if (!lastAlert) return false;
  const last = new Date(lastAlert);
  const now = new Date();
  return (
    last.getFullYear() === now.getFullYear() &&
    last.getMonth() === now.getMonth() &&
    last.getDate() === now.getDate()
  );
}

function markAlertSent() {
  localStorage.setItem("license_alert_last", new Date().toISOString());
}

export function useLicenseValidation() {
  const {
    licenseId,
    expiresAt,
    updateLastChecked,
    updateLastValidated,
    clearLicense,
  } = useLicenseStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const validate = async () => {
    if (!licenseId) return;

    try {
      const { fingerprint } = await licenseApi.getFingerprint();

      const result = await licenseApi.heartbeat({
        licenseId,
        hardwareFp: fingerprint,
      });

      updateLastChecked();

      if (result.revoked) {
        clearLicense();
        useToastStore
          .getState()
          .addToast("Licença revogada. Contacte o suporte.", "error");
        return;
      }

      if (!result.valid) {
        clearLicense();
        useToastStore
          .getState()
          .addToast("Licença inválida ou expirada.", "error");
        return;
      }

      updateLastValidated();

      if (
        result.daysRemaining <= ALERT_THRESHOLD_DAYS &&
        result.daysRemaining > 0
      ) {
        if (!wasAlertSentToday()) {
          useToastStore.getState().addToast(
            `Faltam ${result.daysRemaining} dia(s) para a licença expirar.`,
            "warning"
          );
          markAlertSent();
        }
      }

      if (result.daysRemaining <= 0) {
        clearLicense();
        useToastStore
          .getState()
          .addToast("Licença expirada. Insira uma nova licença.", "error");
      }
    } catch {
      console.log("[LicenseValidation] Failed to validate, will retry later");
    }
  };

  useEffect(() => {
    if (!licenseId || !expiresAt) return;

    const checkExpiry = () => {
      const expDate = new Date(expiresAt);
      const now = new Date();

      if (expDate <= now) {
        clearLicense();
        useToastStore
          .getState()
          .addToast("Licença expirada. Insira uma nova licença.", "error");
        return;
      }

      const daysRemaining = Math.ceil(
        (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysRemaining <= ALERT_THRESHOLD_DAYS && !wasAlertSentToday()) {
        useToastStore.getState().addToast(
          `Faltam ${daysRemaining} dia(s) para a licença expirar.`,
          "warning"
        );
        markAlertSent();
      }
    };

    checkExpiry();
    validate();

    intervalRef.current = setInterval(() => {
      checkExpiry();
      validate();
    }, VALIDATION_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [licenseId, expiresAt]);

  return { validate };
}
