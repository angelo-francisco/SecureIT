export const colors = {
  primary: "#2C9ED5",
  "primary-hover": "#2586B5",
  background: {
    dark: "#101922",
    light: "#ffffff",
  },
  surface: {
    dark: "#1c2127",
    hover: "#283039",
  },
  border: {
    dark: "#3b4754",
  },
  text: {
    muted: "#9dabb9",
    secondary: "#9dabb9",
  },
  success: "#22c55e",
  error: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
} as const;

export type ColorKey = keyof typeof colors;
