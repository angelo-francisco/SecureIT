import type { Notification } from "../types";
import { apiClient } from "./client";

export const notificationsApi = {
  list: (page?: number) =>
    apiClient.get<{ results: Notification[]; has_next: boolean; has_previous: boolean; number: number; num_pages: number }>(
      "/api/notifications",
      page ? { page: String(page) } : {}
    ),

  delete: (id: number) =>
    apiClient.delete<{ message: string }>(`/api/notifications/${id}`),
};
