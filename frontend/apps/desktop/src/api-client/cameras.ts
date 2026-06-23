import type { Camera, CameraFormData } from "../types";
import { apiClient } from "./client";

export const camerasApi = {
  list: (search_query?: string) =>
    apiClient.get<Camera[]>("/cameras/", search_query ? { search_query } : undefined),

  get: (id: number) => apiClient.get<Camera>(`/cameras/${id}/`),

  create: (data: CameraFormData) =>
    apiClient.post<Camera>("/cameras/new/", data),

  update: (id: number, data: Partial<CameraFormData>) =>
    apiClient.put<Camera>(`/cameras/${id}/edit/`, data),

  delete: (id: number) =>
    apiClient.delete<{ message: string }>(`/cameras/${id}/delete/`),

  getLocalDevices: () =>
    apiClient.get<{ path: string; name: string }[]>("/cameras/get-cameras"),
};
