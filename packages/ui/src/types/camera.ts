export type ConnectionType = "L" | "W";
export type CameraTask = "D" | "FR" | "BA";

export interface Camera {
  id: number;
  name: string;
  location: string;
  status: boolean;
  connection_type: ConnectionType;
  connection_info: Record<string, unknown> | null;
  video_source: string | number | null;
  face_recognition: boolean;
  task: CameraTask;
  created_at: string;
  updated_at: string;
  get_name: string;
}

export interface CameraFormData {
  name: string;
  location: string;
  connection_type: ConnectionType;
  connection_info: Record<string, unknown>;
  face_recognition?: boolean;
  task?: CameraTask;
}
