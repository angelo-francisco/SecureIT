import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { initApiBase, isRunningInTauri } from "./api-client/api-base";
import { initFrontendLogger } from "./lib/logger";
import { ErrorBoundary } from "./components/ErrorBoundary";
import App from "./App";
import "./index.css";


const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

initFrontendLogger();
initApiBase().catch(() => {});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

// The window is created hidden to avoid a white flash before the UI mounts;
// reveal it once the loader (logo + "SecureIT") is on screen.
if (isRunningInTauri()) {
  getCurrentWindow().show();
}
