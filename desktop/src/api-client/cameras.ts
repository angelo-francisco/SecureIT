import type { Camera, CameraFormData } from "../types";
import { apiClient } from "./client";

export interface LocalDevice {
  id: number;
  name: string;
  path: string;
  backend: number;
  index: number;
  usable: boolean;
}

export const camerasApi = {
  list: (search_query?: string) =>
    apiClient.get<Camera[]>("/api/cameras", search_query ? { search_query } : undefined),

  get: (id: number) => apiClient.get<Camera>(`/api/cameras/${id}`),

  create: (data: CameraFormData) =>
    apiClient.post<Camera>("/api/cameras", data),

  update: (id: number, data: Partial<CameraFormData>) =>
    apiClient.put<Camera>(`/api/cameras/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<{ message: string }>(`/api/cameras/${id}`),

  getLocalDevices: (refresh?: boolean) =>
    apiClient.get<LocalDevice[]>("/api/cameras/available", refresh ? { refresh: "true" } : undefined),
};
