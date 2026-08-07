import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BackgroundContext, type BackgroundVariant } from "./background";
import {
  SANCTUARY_THEMES,
  type SanctuaryThemeId,
} from "../components/sanctuary-b/themes";

const STORAGE_KEY = "aidfinder:background";
const THEME_STORAGE_KEY = "aidfinder:sanctuary-b-theme";

function loadVariant(): BackgroundVariant {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "dusk") return "dusk";
  if (stored === "sanctuary") return "sanctuary";
  if (stored === "sanctuary-b") return "sanctuary-b";
  if (stored === "sanctuary-c") return "sanctuary-c";
  if (stored === "ledger") return "ledger";
  if (stored === "atlas") return "atlas";
  if (stored === "casita") return "casita";
  if (stored === "vault") return "vault";
  // "bluesky" was the previous name of the landscape variant.
  if (stored === "landscape" || stored === "bluesky") return "landscape";
  return "shader";
}

function loadTheme(): SanctuaryThemeId {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  const match = SANCTUARY_THEMES.find((t) => t.id === stored);
  return match ? match.id : "dusk";
}

export function BackgroundProvider({ children }: { children: ReactNode }) {
  const [variant, setVariant] = useState<BackgroundVariant>(loadVariant);
  const [sanctuaryTheme, setSanctuaryTheme] =
    useState<SanctuaryThemeId>(loadTheme);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, variant);
  }, [variant]);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, sanctuaryTheme);
  }, [sanctuaryTheme]);

  const value = useMemo(
    () => ({ variant, setVariant, sanctuaryTheme, setSanctuaryTheme }),
    [variant, sanctuaryTheme],
  );

  return (
    <BackgroundContext.Provider value={value}>
      {children}
    </BackgroundContext.Provider>
  );
}
