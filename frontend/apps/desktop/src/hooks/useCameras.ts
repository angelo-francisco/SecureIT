import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CameraFormData } from "../types";
import { camerasApi } from "../api-client";

export function useCameras(search?: string) {
  return useQuery({
    queryKey: ["cameras", search],
    queryFn: () => camerasApi.list(search),
  });
}

export function useCreateCamera() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CameraFormData) => camerasApi.create(data),
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
