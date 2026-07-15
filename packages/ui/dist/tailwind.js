// src/tailwind.ts
var uiPreset = {
  theme: {
    extend: {
      colors: {
        primary: "#2C9ED5",
        "primary-hover": "#2586B5",
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-hover": "var(--surface-hover)",
        border: "var(--border)",
        "border-light": "var(--border-light)",
        text: "var(--text)",
        "text-muted": "var(--text-muted)",
        success: "#22c55e",
        error: "#ef4444",
        warning: "#f59e0b",
        info: "#3b82f6",
        "background-dark": "var(--bg)",
        "background-light": "#ffffff",
        "surface-dark": "var(--surface)",
        "border-dark": "var(--border)",
        "text-secondary": "var(--text-muted)"
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"]
      }
    }
  }
};
export {
  uiPreset
};
