import { createContext, useContext } from "react";

export type PanelNavigate = (view: string) => void;

export const PanelNavContext = createContext<PanelNavigate | null>(null);

export function usePanelNavigate() {
  return useContext(PanelNavContext);
}
