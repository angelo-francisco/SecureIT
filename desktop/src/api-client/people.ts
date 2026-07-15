import type {
  Person,
  PersonFormData,
  Role,
} from "../types";
import { apiClient } from "./client";

export const peopleApi = {
  // People
  list: (search_query?: string, page?: number) =>
    apiClient.get<{ results: Person[]; has_next: boolean; has_previous: boolean; number: number; num_pages: number }>(
      "/api/people",
      { ...(search_query ? { search_query } : {}), ...(page ? { page: String(page) } : {}) }
    ),

  get: (id: number) => apiClient.get<Person>(`/api/people/${id}`),

  create: (data: PersonFormData) =>
    apiClient.post<Person>("/api/people", data),

  update: (id: number, data: Partial<PersonFormData>) =>
    apiClient.put<Person>(`/api/people/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<{ message: string }>(`/api/people/${id}`),

  searchByFace: (photo: string) =>
    apiClient.post<Person>("/api/people/search-by-face", { photo_base64: photo }),

  // Roles
  listRoles: () => apiClient.get<Role[]>("/api/people/roles"),

  createRole: (data: { name: string; description?: string; fields?: { label: string; field_type?: string; required?: boolean; options?: string[] }[] }) =>
    apiClient.post<Role>("/api/people/roles", data),

  getRole: (id: number) => apiClient.get<Role>(`/api/people/roles/${id}`),

  updateRole: (id: number, data: { name?: string; description?: string; fields?: { label: string; field_type?: string; required?: boolean; options?: string[] }[] }) =>
    apiClient.put<Role>(`/api/people/roles/${id}`, data),

  deleteRole: (id: number) =>
    apiClient.delete<{ message: string }>(`/api/people/roles/${id}`),
};
