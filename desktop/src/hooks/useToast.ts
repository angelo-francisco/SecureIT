import { useCallback } from "react";
import { useToastStore, type ToastType } from "../stores/toast";

export function useToast() {
  const addToast = useToastStore((s) => s.addToast);

  const toast = useCallback(
    (message: string, type: ToastType = "info") => addToast(message, type),
    [addToast]
  );

  return { toast };
}
