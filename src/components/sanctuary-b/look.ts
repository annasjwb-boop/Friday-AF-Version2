import {
  getSanctuaryTheme,
  type SanctuaryTheme,
} from "../sanctuary-b/themes";
import type { StateParams } from "../sanctuary-b/models/state";

/**
 * Creative look for the product sanctuary — a real color and brightness,
 * not a named mood. Sticks across Home ↔ Explore; never part of "truth."
 */
export type SanctuaryLook = {
  /** Accent hex driving glows, lanterns, and the dome's warm edge. */
  color: string;
  /** 0..100 — how brightly the scene is lit. */
  brightness: number;
};

/** Solid color chips shown in the model / look sheet. */
export const LOOK_COLORS: { hex: string; label: string }[] = [
  { hex: "#e8a35c", label: "Amber" },
  { hex: "#e86a4a", label: "Coral" },
  { hex: "#edff3d", label: "Yellow" },
  { hex: "#6da7dc", label: "Sky" },
  { hex: "#3ecfcf", label: "Teal" },
  { hex: "#8b7cff", label: "Violet" },
  { hex: "#f553a0", label: "Rose" },
  { hex: "#f2e8d2", label: "Ivory" },
];

export const DEFAULT_LOOK: SanctuaryLook = {
  color: "#e8a35c",
  brightness: 70,
};

/** Neutral daylight theme with the look's accent swapped in. */
export function lookToTheme(look: SanctuaryLook): SanctuaryTheme {
  const base = getSanctuaryTheme("dusk");
  return {
    ...base,
    accent: look.color,
    // Soft ground bounce picks up a hint of the chosen color.
    scene: {
      ...base.scene,
      under: look.color,
    },
  };
}

/**
 * Applies look on top of profile-derived params: forces the accent color
 * and scales scene light / glow by brightness.
 */
export function applyLook(params: StateParams, look: SanctuaryLook): StateParams {
  const t = look.brightness / 100;
  return {
    ...params,
    accent: look.color,
    light: params.light * (0.48 + t * 0.72),
    glow: params.glow * (0.55 + t * 0.75),
  };
}
