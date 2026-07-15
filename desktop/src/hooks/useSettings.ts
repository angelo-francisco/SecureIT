import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SettingsFormData } from "../types";
import { settingsApi } from "../api-client";

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsApi.get(),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SettingsFormData) => settingsApi.update(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}
