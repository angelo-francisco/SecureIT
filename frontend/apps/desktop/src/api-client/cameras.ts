import type { Camera, CameraFormData } from "../types";
import { apiClient } from "./client";

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

  getLocalDevices: () =>
    apiClient.get<{ path: string; name: string }[]>("/api/cameras/available"),
};
