export type NotificationLevel = "I" | "E" | "S" | "P";

export interface Notification {
  id: number;
  title: string;
  description: string;
  level: NotificationLevel;
  photo?: string;
  camera: number;
  camera_name: string;
  person_id?: number | null;
  created_at: string;
}
