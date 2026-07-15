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
  const ws = new WebSocket(
    `${getWsBaseUrl()}/ws/${consumerName}?token=${encodeURIComponent(token)}&camera_id=${cameraId}&vs=${videoSource}`
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
