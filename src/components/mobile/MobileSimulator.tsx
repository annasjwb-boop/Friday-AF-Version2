import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { Monitor, Moon, Smartphone, Sun } from "lucide-react";
import { BackgroundTableOfContents } from "./BackgroundTableOfContents";
import { DEVICE_MODE, SHOW_VARIANT_PICKER } from "../../app/config";
import "./MobileSimulator.css";

const DesktopHome = lazy(() =>
  import("../desktop/DesktopHome").then((m) => ({ default: m.DesktopHome })),
);

type MobileSimulatorProps = {
  children: ReactNode;
};

type Theme = "light" | "dark";
type DeviceMode = "mobile" | "desktop";

const THEME_STORAGE_KEY = "aidfinder:theme";
const MODE_STORAGE_KEY = "aidfinder:device-mode";

function loadTheme(): Theme {
  return localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
}

function loadMode(): DeviceMode {
  // A pinned DEVICE_MODE wins over whatever the visitor last toggled.
  if (DEVICE_MODE !== "auto") return DEVICE_MODE;
  return localStorage.getItem(MODE_STORAGE_KEY) === "desktop"
    ? "desktop"
    : "mobile";
}

/**
 * Presents the application inside a mobile-sized viewport, or — when switched
 * to desktop mode — as the single widescreen desktop variant (no table of
 * contents). On desktop it renders a neutral device frame; below 500px it
 * becomes edge-to-edge and behaves like a responsive mobile website.
 */
export function MobileSimulator({ children }: MobileSimulatorProps) {
  const [theme, setTheme] = useState<Theme>(loadTheme);
  const [mode, setMode] = useState<DeviceMode>(loadMode);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (DEVICE_MODE === "auto") localStorage.setItem(MODE_STORAGE_KEY, mode);
  }, [mode]);

  return (
    <div className={`simulator-stage${mode === "desktop" ? " is-desktop" : ""}`}>
      {mode === "mobile" ? (
        <>
          {SHOW_VARIANT_PICKER && <BackgroundTableOfContents />}

          <div className="simulator-device" id="app-device">
            <div className="simulator-viewport" id="app-viewport">
              {children}
            </div>
          </div>
        </>
      ) : (
        <Suspense fallback={null}>
          <DesktopHome />
        </Suspense>
      )}

      <div className="stage-controls">
        {DEVICE_MODE === "auto" && (
          <button
            type="button"
            className="stage-toggle"
            onClick={() => setMode(mode === "mobile" ? "desktop" : "mobile")}
            aria-label={`Switch to ${mode === "mobile" ? "desktop" : "mobile"} version`}
          >
            {mode === "mobile" ? (
              <Monitor size={20} strokeWidth={2} aria-hidden="true" />
            ) : (
              <Smartphone size={20} strokeWidth={2} aria-hidden="true" />
            )}
          </button>
        )}
        <button
          type="button"
          className="stage-toggle"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? (
            <Moon size={20} strokeWidth={2} aria-hidden="true" />
          ) : (
            <Sun size={20} strokeWidth={2} aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}
