import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PersonFormData } from "../types";
import { peopleApi } from "../api-client";

export function usePeople(search?: string, page?: number) {
  return useQuery({
    queryKey: ["people", search, page],
    queryFn: () => peopleApi.list(search, page),
  });
}

export function usePerson(id: number) {
  return useQuery({
    queryKey: ["person", id],
    queryFn: () => peopleApi.get(id),
    enabled: !!id,
  });
}

export function useCreatePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PersonFormData) => peopleApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["people"] }),
  });
}

export function useUpdatePerson(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PersonFormData>) => peopleApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["people"] }),
  });
}

export function useDeletePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => peopleApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["people"] }),
  });
}

export function useSearchByFace() {
  return useMutation({
    mutationFn: (photo: string) => peopleApi.searchByFace(photo),
  });
}

export function useVisits(personId: number) {
  return useQuery({
    queryKey: ["visits", personId],
    queryFn: () => peopleApi.getVisits(personId),
    enabled: !!personId,
  });
}

export function useNewVisit(visitorId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { destinies: number[]; desc?: string }) =>
      peopleApi.newVisit(visitorId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["visits"] }),
  });
}

export function useVisitorTypes() {
  return useQuery({
    queryKey: ["visitor-types"],
    queryFn: () => peopleApi.getVisitorTypes(),
  });
}

export function useFields() {
  return useQuery({
    queryKey: ["fields"],
    queryFn: () => peopleApi.getFields(),
  });
}

export function useHomes() {
  return useQuery({
    queryKey: ["homes"],
    queryFn: () => peopleApi.getHomes(),
  });
}

export function useHosts() {
  return useQuery({
    queryKey: ["hosts"],
    queryFn: () => peopleApi.getHosts(),
  });
}
