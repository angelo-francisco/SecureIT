import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { initApiBase, isRunningInTauri } from "./api-client/api-base";
import App from "./App";
import "./index.css";


const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

initApiBase().catch(() => {});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);

// The window is created hidden to avoid a white flash before the UI mounts;
// reveal it once the loader (logo + "SecureIT") is on screen.
if (isRunningInTauri()) {
  getCurrentWindow().show();
}
