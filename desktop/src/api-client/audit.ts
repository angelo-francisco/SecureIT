export interface AuditLog {
  id: number;
  profile_id: string | null;
  action: "create" | "update" | "delete";
  entity_type: string;
  entity_id: string;
  synced: boolean;
  created_at: string;
}

export interface AuditLogListResponse {
  results: AuditLog[];
  has_next: boolean;
  has_previous: boolean;
  number: number;
  num_pages: number;
}

export const auditApi = {
  list: (params?: { action?: string; entity_type?: string; page?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.action) searchParams.set("action", params.action);
    if (params?.entity_type) searchParams.set("entity_type", params.entity_type);
    if (params?.page) searchParams.set("page", String(params.page));
    const qs = searchParams.toString();
    return apiClient.get<AuditLogListResponse>(`/api/audit/logs${qs ? `?${qs}` : ""}`);
  },

  markSynced: (ids: number[]) =>
    apiClient.post("/api/audit/logs/synced", { ids }),
};

import { apiClient } from "./client";
