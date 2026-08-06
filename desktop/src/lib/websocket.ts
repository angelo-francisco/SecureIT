import { getWsBaseUrl } from "../api-client/client";

interface CameraConnection {
  ws: WebSocket;
  cameraId: number | string;
}

const connections = new Map<string, CameraConnection>();

export function connectCamera(
  cameraId: number | string,
  videoSource: string | number,
  consumerName: string,
  onFrame: (blob: Blob) => void,
  onMessage?: (data: Record<string, unknown>) => void,
  onClose?: () => void,
  customKey?: string,
): string {
  const key = customKey || `${consumerName}-${cameraId}`;

  if (connections.has(key)) {
    connections.get(key)!.ws.close();
  }

  const token = localStorage.getItem("access_token") || "";

  let pid = "";
  let uid = "";
  try {
    const profileRaw = localStorage.getItem("selected_profile");
    if (profileRaw) {
      const profile = JSON.parse(profileRaw);
      if (profile?.id) pid = profile.id;
    }
    const userRaw = localStorage.getItem("user");
    if (userRaw) {
      const user = JSON.parse(userRaw);
      if (user?.id) uid = user.id;
    }
  } catch {}

  const ws = new WebSocket(
    `${getWsBaseUrl()}/ws/${consumerName}?token=${encodeURIComponent(token)}&camera_id=${encodeURIComponent(String(cameraId))}&vs=${encodeURIComponent(String(videoSource))}&pid=${encodeURIComponent(pid)}&uid=${encodeURIComponent(uid)}`
  );
  ws.binaryType = "arraybuffer";

  ws.onmessage = (event) => {
    if (typeof event.data === "string") {
      const data = JSON.parse(event.data);
      onMessage?.(data);
    } else if (event.data instanceof ArrayBuffer) {
      const blob = new Blob([event.data], { type: "image/jpeg" });
      onFrame(blob);
    }
  };

  ws.onclose = () => {
    connections.delete(key);
    onClose?.();
  };

  connections.set(key, { ws, cameraId });

  return key;
}

export function disconnectCamera(key: string) {
  const conn = connections.get(key);
  if (conn) {
    conn.ws.close();
    connections.delete(key);
  }
}

export function disconnectAll() {
  connections.forEach((conn) => conn.ws.close());
  connections.clear();
}

if (typeof window !== "undefined") {
  const closeOnUnload = () => disconnectAll();
  window.addEventListener("pagehide", closeOnUnload);
  window.addEventListener("beforeunload", closeOnUnload);
}
