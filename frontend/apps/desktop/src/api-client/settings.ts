import type { Settings, SettingsFormData } from "../types";
import { apiClient } from "./client";

export const settingsApi = {
  get: () => apiClient.get<Settings>("/api/settings"),

  update: (data: SettingsFormData) =>
    apiClient.put<Settings>("/api/settings", data),
};
