import { useMutation } from "@tanstack/react-query";
import { peopleApi } from "../api-client/people";
import type { Person } from "../types";

export function useFaceSearch() {
  return useMutation({
    mutationFn: (photo: string) => peopleApi.searchByFace(photo),
  });
}
