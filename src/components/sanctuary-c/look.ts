import {
  getSanctuaryTheme,
  type SanctuaryTheme,
} from "../sanctuary-c/themes";
import type { StateParams } from "../sanctuary-c/models/state";

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

/** Solid color chips shown in the model / look sheet — Polestar's orange
 *  first, then a restrained set of automotive paint tones. */
export const LOOK_COLORS: { hex: string; label: string }[] = [
  { hex: "#ff7500", label: "Orange" },
  { hex: "#ff4d00", label: "Ember" },
  { hex: "#d9d9db", label: "Silver" },
  { hex: "#8f9aa6", label: "Steel" },
  { hex: "#4a7ab5", label: "Blue" },
  { hex: "#3aa6a6", label: "Teal" },
  { hex: "#f2f2ef", label: "Ivory" },
  { hex: "#55555a", label: "Graphite" },
];

export const DEFAULT_LOOK: SanctuaryLook = {
  color: "#ff7500",
  brightness: 70,
};

/** Neutral studio theme with the look's accent swapped in. */
export function lookToTheme(look: SanctuaryLook): SanctuaryTheme {
  const base = getSanctuaryTheme("dusk");
  return {
    ...base,
    accent: look.color,
    // Polestar studio: the environment stays neutral — the chosen color
    // only reaches the scene through glows and the dome edge, never as a
    // color wash on the floor.
    scene: {
      ...base.scene,
      under: mixHex(base.scene.under, look.color, 0.22),
    },
  };
}

/** Linear mix of two hex colors, t = weight of `b`. */
function mixHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (sa: number, sb: number) =>
    Math.round(sa + (sb - sa) * t)
      .toString(16)
      .padStart(2, "0");
  return `#${ch((pa >> 16) & 255, (pb >> 16) & 255)}${ch((pa >> 8) & 255, (pb >> 8) & 255)}${ch(pa & 255, pb & 255)}`;
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
