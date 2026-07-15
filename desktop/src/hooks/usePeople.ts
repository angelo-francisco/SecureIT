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

export function usePerson(id: number | null) {
  return useQuery({
    queryKey: ["people", id],
    queryFn: () => peopleApi.get(id!),
    enabled: id !== null,
  });
}

export function useUpdatePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PersonFormData> }) =>
      peopleApi.update(id, data),
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

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: () => peopleApi.listRoles(),
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; fields?: { label: string; field_type?: string; required?: boolean; options?: string[] }[] }) =>
      peopleApi.createRole(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; name?: string; description?: string; fields?: { label: string; field_type?: string; required?: boolean; options?: string[] }[] }) =>
      peopleApi.updateRole(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => peopleApi.deleteRole(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
  });
}


