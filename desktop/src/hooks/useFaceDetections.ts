import { useQuery } from "@tanstack/react-query";
import { faceDetectionsApi } from "../api-client";

export function useFaceDetections(page = 1, knownOnly = false) {
  return useQuery({
    queryKey: ["face-detections", page, knownOnly],
    queryFn: () => faceDetectionsApi.list(page, knownOnly),
  });
}
