import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { isRunningInTauri } from "./api-base";

export interface AppUpdateInfo {
  available: boolean;
  current_version: string;
  remote_version: string;
  notes: string;
}

export interface ApiUpdateInfo {
  available: boolean;
  current_version: string;
  remote_version: string;
}

export interface UpdateProgress {
  downloaded: number;
  total: number;
}

export interface ApiUpdateProgress {
  phase: "fetching_release" | "downloading" | "extracting" | "complete";
  url?: string;
  version?: string;
}

export async function checkForAppUpdate(): Promise<AppUpdateInfo | null> {
  if (!isRunningInTauri()) return null;
  try {
    return await invoke<AppUpdateInfo>("check_for_app_update");
  } catch {
    return null;
  }
}

export async function installAppUpdate(): Promise<void> {
  if (!isRunningInTauri()) return;
  await invoke<void>("install_app_update");
}

export async function checkApiUpdate(): Promise<ApiUpdateInfo | null> {
  if (!isRunningInTauri()) return null;
  try {
    return await invoke<ApiUpdateInfo>("check_api_update");
  } catch {
    return null;
  }
}

export async function installApiUpdate(): Promise<void> {
  if (!isRunningInTauri()) return;
  await invoke<void>("install_api_update");
}

export function onAppUpdateProgress(
  cb: (progress: UpdateProgress) => void,
): () => void {
  const unlisten = listen<UpdateProgress>("app-update-progress", (event) => {
    cb(event.payload);
  });
  return () => {
    unlisten.then((fn) => fn());
  };
}

export function onApiUpdateProgress(
  cb: (progress: ApiUpdateProgress) => void,
): () => void {
  const unlisten = listen<ApiUpdateProgress>(
    "api-update-progress",
    (event) => {
      cb(event.payload);
    },
  );
  return () => {
    unlisten.then((fn) => fn());
  };
}
