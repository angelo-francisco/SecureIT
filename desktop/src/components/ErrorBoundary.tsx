import { Component, type ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";
import { isRunningInTauri } from "../api-client/api-base";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
  stack?: string;
}

/**
 * Catches render/effects crashes anywhere below it and shows a readable
 * error card instead of a blank window, with a reload button and (in Tauri)
 * a shortcut to open the per-run log folder.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // The patched console.error forwards this into the per-run log file.
    console.error("React render error:", error, info);
  }

  handleOpenLogs = () => {
    if (!isRunningInTauri()) return;
    invoke("open_logs_folder").catch(() => {});
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "var(--surface-bg, #0f1115)",
          color: "var(--text, #e6e8eb)",
          fontFamily: "var(--font-sans, system-ui, sans-serif)",
        }}
      >
        <div
          style={{
            maxWidth: 520,
            width: "100%",
            padding: 24,
            borderRadius: 12,
            border: "1px solid var(--border, #2a2d34)",
            background: "var(--surface, #181b20)",
          }}
        >
          <h1 style={{ margin: "0 0 8px", fontSize: 20 }}>
            Algo deu errado
          </h1>
          <p style={{ margin: "0 0 16px", color: "var(--text-muted, #9aa1ab)" }}>
            O aplicativo encontrou um erro inesperado. Recarregue para
            continuar. Se o problema persistir, abra a pasta de logs e envie o
            arquivo mais recente.
          </p>
          <pre
            style={{
              margin: "0 0 16px",
              padding: 12,
              borderRadius: 8,
              background: "var(--surface-hover, #1f232a)",
              overflow: "auto",
              maxHeight: 180,
              fontSize: 12,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {this.state.message}
            {this.state.stack ? `\n\n${this.state.stack}` : ""}
          </pre>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={this.handleReload}
              style={{
                flex: 1,
                padding: "10px 16px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                background: "var(--primary, #3b82f6)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              Recarregar
            </button>
            {isRunningInTauri() && (
              <button
                onClick={this.handleOpenLogs}
                style={{
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: "1px solid var(--border, #2a2d34)",
                  cursor: "pointer",
                  background: "var(--surface-hover, #1f232a)",
                  color: "var(--text, #e6e8eb)",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                Abrir pasta de logs
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
}
