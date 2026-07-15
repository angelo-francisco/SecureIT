import type { Notification, NotificationFilter } from "../types";
import { apiClient } from "./client";

export const notificationsApi = {
  list: (filter?: NotificationFilter, page?: number) =>
    apiClient.get<{ results: Notification[]; has_next: boolean; has_previous: boolean; number: number; num_pages: number }>(
      "/api/notifications",
      { ...(filter?.search_query ? { search_query: filter.search_query } : {}), ...(page ? { page: String(page) } : {}) }
    ),

  delete: (id: number) =>
    apiClient.delete<{ message: string }>(`/api/notifications/${id}`),
};
