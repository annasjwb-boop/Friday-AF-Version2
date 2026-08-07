import { createContext, useContext } from "react";
import type { SanctuaryThemeId } from "../components/sanctuary-b/themes";

/** Selectable device backgrounds shown in the table of contents. */
export type BackgroundVariant =
  | "shader"
  | "landscape"
  | "dusk"
  | "sanctuary"
  | "sanctuary-b"
  | "sanctuary-c"
  | "ledger"
  | "atlas"
  | "casita"
  | "vault";

export type BackgroundOption = {
  id: BackgroundVariant;
  label: string;
};

export const BACKGROUND_OPTIONS: BackgroundOption[] = [
  { id: "shader", label: "Gradient Shader" },
  { id: "landscape", label: "Dawn Landscape" },
  { id: "dusk", label: "Dusk Grain" },
  { id: "sanctuary", label: "Sanctuary 4.A" },
  { id: "sanctuary-b", label: "Sanctuary 4.B" },
  { id: "sanctuary-c", label: "Sanctuary 4.C" },
  { id: "ledger", label: "Recovery Ledger" },
  { id: "atlas", label: "Home Atlas" },
  { id: "casita", label: "Casita Maquette" },
  { id: "vault", label: "Readiness Vault" },
];

export type BackgroundContextValue = {
  variant: BackgroundVariant;
  setVariant: (variant: BackgroundVariant) => void;
  /** Environment theme for the Sanctuary 4.B backdrop and scene. */
  sanctuaryTheme: SanctuaryThemeId;
  setSanctuaryTheme: (theme: SanctuaryThemeId) => void;
};

export const BackgroundContext = createContext<BackgroundContextValue | null>(
  null,
);

export function useBackground(): BackgroundContextValue {
  const context = useContext(BackgroundContext);
  if (!context) {
    throw new Error("useBackground must be used within BackgroundProvider");
  }
  return context;
}
