import { useEffect, useRef, useCallback } from "react";
import { getWsBaseUrl } from "../api-client/client";

interface WebSocketHandlers {
  onFrame?: (blob: Blob) => void;
  onNotification?: (data: Record<string, unknown>) => void;
  onClose?: () => void;
}

export function useWebSocket(
  cameraId: number | string,
  videoSource: string | number,
  consumerName: string,
  handlers: WebSocketHandlers,
  enabled = true
) {
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const connect = useCallback(() => {
    if (!enabled || !cameraId || !videoSource) return;

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

    const url = `${getWsBaseUrl()}/ws/${consumerName}/${cameraId}/?vs=${encodeURIComponent(String(videoSource))}&pid=${encodeURIComponent(pid)}&uid=${encodeURIComponent(uid)}`;

    try {
      const ws = new WebSocket(url);
      ws.binaryType = "arraybuffer";

      ws.onmessage = (event) => {
        if (typeof event.data === "string") {
          const data = JSON.parse(event.data);
          if (data.type === "notification") {
            handlersRef.current.onNotification?.(data);
          }
        } else if (event.data instanceof ArrayBuffer) {
          const blob = new Blob([event.data], { type: "image/jpeg" });
          handlersRef.current.onFrame?.(blob);
        }
      };

      ws.onclose = () => {
        handlersRef.current.onClose?.();
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("WebSocket connection error:", err);
    }
  }, [cameraId, videoSource, consumerName, enabled]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { disconnect, reconnect: connect };
}
