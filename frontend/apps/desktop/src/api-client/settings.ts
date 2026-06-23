import type { Settings, SettingsFormData } from "../types";
import { apiClient } from "./client";

export const settingsApi = {
  get: () => apiClient.get<Settings>("/panel/settings/"),

  update: (data: SettingsFormData) =>
    apiClient.post<Settings>("/panel/settings/", data),
};
