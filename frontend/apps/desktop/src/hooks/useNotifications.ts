import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { NotificationFilter } from "../types";
import { notificationsApi } from "../api-client";

export function useNotifications(filter?: NotificationFilter, page?: number) {
  return useQuery({
    queryKey: ["notifications", filter, page],
    queryFn: () => notificationsApi.list(filter, page),
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notificationsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
