import { useMutation } from "@tanstack/react-query";
import { peopleApi } from "../api-client/people";

export function useFaceSearch() {
  return useMutation({
    mutationFn: (photo: string) => peopleApi.searchByFace(photo),
  });
}
