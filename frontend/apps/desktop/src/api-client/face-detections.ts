import { apiClient } from "./client";

export interface FaceDetection {
  id: number;
  person_id: number | null;
  name: string | null;
  unknown: boolean;
  confidence: number;
  camera_id: number | null;
  camera_name: string | null;
  photo: string | null;
  created_at: string;
}

interface PaginatedResponse {
  results: FaceDetection[];
  has_next: boolean;
  has_previous: boolean;
  number: number;
  num_pages: number;
}

export const faceDetectionsApi = {
  list: (page = 1, knownOnly = false) =>
    apiClient.get<PaginatedResponse>("/api/face-detections", { page, known_only: knownOnly }),
};
