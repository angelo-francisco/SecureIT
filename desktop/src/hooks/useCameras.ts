import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CameraFormData } from "../types";
import { camerasApi } from "../api-client";

export function useCameras(search?: string) {
  return useQuery({
    queryKey: ["cameras", search],
    queryFn: () => camerasApi.list(search),
  });
}

export function useCamera(id: number | null) {
  return useQuery({
    queryKey: ["cameras", id],
    queryFn: () => camerasApi.get(id!),
    enabled: id !== null,
  });
}

export function useCreateCamera() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CameraFormData) => camerasApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cameras"] }),
  });
}

export function useUpdateCamera() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CameraFormData> }) =>
      camerasApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cameras"] }),
  });
}

export function useDeleteCamera() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => camerasApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cameras"] }),
  });
}

export function useLocalDevices() {
  return useQuery({
    queryKey: ["local-devices"],
    queryFn: () => camerasApi.getLocalDevices(),
  });
}

export function useRefreshLocalDevices() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => camerasApi.getLocalDevices(true),
    onSuccess: (devices) => qc.setQueryData(["local-devices"], devices),
  });
}
