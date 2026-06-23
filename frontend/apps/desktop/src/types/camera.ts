export type ConnectionType = "L" | "W";

export interface Camera {
  id: number;
  name: string;
  location: string;
  status: boolean;
  connection_type: ConnectionType;
  video_source: string | number;
  detectionline: boolean;
  created_at: string;
  updated_at: string;
  get_name: string;
  get_connection_type_display: string;
  wificamera?: WifiCamera;
  localcamera?: LocalCamera;
}

export interface WifiCamera {
  stream_url: string;
}

export interface LocalCamera {
  path: string;
}

export interface CameraFormData {
  name: string;
  location: string;
  connection_type: ConnectionType;
  stream_url?: string;
  local_camera?: string;
}
