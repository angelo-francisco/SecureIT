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
      "/people/",
      { ...(search_query ? { search_query } : {}), ...(page ? { page: String(page) } : {}) }
    ),

  get: (id: number) => apiClient.get<Person>(`/people/${id}/`),

  create: (data: PersonFormData) =>
    apiClient.post<Person>("/people/new/", data),

  update: (id: number, data: Partial<PersonFormData>) =>
    apiClient.put<Person>(`/people/${id}/edit/`, data),

  delete: (id: number) =>
    apiClient.delete<{ message: string }>(`/people/${id}/delete/`),

  searchByFace: (photo: string) =>
    apiClient.post<[number, string, string, string][]>("/people/search-face/", { photo }),

  getVisits: (id: number) => apiClient.get<Visit[]>(`/people/${id}/visits/`),

  getVisitorTypes: () => apiClient.get<VisitorType[]>("/people/visitor-types/"),

  getFields: () => apiClient.get<Field[]>("/people/fields/"),

  getHomes: () => apiClient.get<Home[]>("/people/homes/"),

  getHosts: () => apiClient.get<Host[]>("/people/hosts/"),

  newVisit: (visitorId: number, data: { destinies: number[]; desc?: string }) =>
    apiClient.post<Visit>(`/people/${visitorId}/new-visit/`, data),
};
