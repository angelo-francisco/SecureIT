import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PersonFormData } from "../types";
import { peopleApi } from "../api-client";

export function usePeople(search?: string, page?: number) {
  return useQuery({
    queryKey: ["people", search, page],
    queryFn: () => peopleApi.list(search, page),
  });
}

export function useCreatePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PersonFormData) => peopleApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["people"] }),
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
