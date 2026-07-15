export interface Settings {
  fps: number;
  monitoring_start_time: string;
  monitoring_end_time: string;
  alert_cooldown: number;
  detect_every: number;
  allow_draw: boolean;
}

export interface SettingsFormData {
  fps: number;
  mst: string;
  met: string;
  alert_cooldown: number;
  detect_every: number;
  allow_draw: boolean;
}
