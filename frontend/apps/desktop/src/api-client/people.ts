import type {
  Person,
  PersonFormData,
  Visit,
  VisitorType,
  Field,
  Host,
  Home,
} from "../types";
import { apiClient } from "./client";

export const peopleApi = {
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
    apiClient.post<[number, string, string, string][]>("/api/people/search-by-face", { photo }),

  getVisits: (id: number) => apiClient.get<Visit[]>(`/api/people/${id}/visits`),

  getVisitorTypes: () => apiClient.get<VisitorType[]>("/api/people/visitor-types"),

  getFields: () => apiClient.get<Field[]>("/api/people/fields"),

  getHomes: () => apiClient.get<Home[]>("/api/people/homes"),

  getHosts: () => apiClient.get<Host[]>("/api/people/hosts"),

  newVisit: (visitorId: number, data: { destinies: number[]; desc?: string }) =>
    apiClient.post<Visit>(`/api/people/${visitorId}/visits`, data),
};
