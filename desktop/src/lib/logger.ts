import { invoke } from "@tauri-apps/api/core";
import { isRunningInTauri } from "../api-client/api-base";

type LogLevel = "log" | "info" | "warn" | "error" | "debug";

const BATCH_MS = 150;

interface Pending {
  level: LogLevel;
  message: string;
  stack?: string;
}

let queue: Pending[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

function flush(): void {
  timer = null;
  if (queue.length === 0) return;
  const batch = queue;
  queue = [];
  const combined = batch
    .map((item) => {
      const head = `[frontend:${item.level}] ${item.message}`;
      return item.stack ? `${head} | ${item.stack}` : head;
    })
    .join("\n");
  try {
    invoke("log_frontend", { level: "log", message: combined }).catch(() => {});
  } catch {
    // logging must never break the app
  }
}

function push(level: LogLevel, args: unknown[], stack?: string): void {
  if (!isRunningInTauri()) return;
  const message = args
    .map((arg) => {
      if (typeof arg === "string") return arg;
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    })
    .join(" ");
  if (!message && !stack) return;
  queue.push({ level, message, stack });
  if (timer === null) {
    timer = setTimeout(flush, BATCH_MS);
  }
}

function patchConsole(): void {
  const methods: LogLevel[] = ["log", "info", "warn", "error", "debug"];
  for (const method of methods) {
    const original = console[method];
    console[method] = function (...args: unknown[]) {
      try {
        original.apply(console, args);
      } catch {
        // keep patched wrapper alive even if the original throws
      }
      push(method, args);
    };
  }
}

/**
 * Forward webview console output and uncaught errors/rejections into the
 * Tauri per-run log file. Call once at app bootstrap. No-op in a plain
 * browser (the log file only exists inside the desktop shell).
 */
export function initFrontendLogger(): void {
  if (!isRunningInTauri()) return;
  patchConsole();

  window.addEventListener("error", (event) => {
    push("error", [event.message, event.filename, String(event.lineno)], event.error?.stack);
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const stack =
      reason instanceof Error ? reason.stack : undefined;
    push("error", ["Unhandled promise rejection:", reason], stack);
  });

  window.addEventListener("beforeunload", () => {
    flush();
  });
}
