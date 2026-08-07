import type { RiskState } from "../../../types/sanctuary";

/**
 * Palette pulled from the reference imagery: bone and cream sculptural
 * surfaces over cocoa shadow, with one warm amber accent.
 */
export const PALETTE = {
  bone: "#e3d8c1",
  boneDark: "#b7a98e",
  cream: "#f2e8d2",
  stone: "#877b67",
  earth: "#4d4335",
  charcoal: "#332c23",
  deep: "#211c15",
  moss: "#6d6b4a",
  mossDead: "#5a5140",
  water: "#3a4442",
  amber: "#e8a35c",
  ember: "#d96536",
};

/**
 * Scalar knobs derived from the risk state. Models interpret these in their
 * own vocabulary (cracks, water level, fractured crystals, missing bridges).
 */
export interface StateParams {
  state: RiskState;
  /** Multiplier for scene light. */
  light: number;
  /** Emissive intensity for windows / crystals / energy. */
  glow: number;
  /** Warm accent color for the current state. */
  accent: string;
  /** Generic 0..1 damage amount. */
  wear: number;
  /** 0..1 environmental threat (water, embers, storm). */
  threat: number;
  damaged: boolean;
  recovering: boolean;
}

export function stateParams(state: RiskState): StateParams {
  switch (state) {
    case "vulnerable":
      return {
        state,
        light: 0.72,
        glow: 0.7,
        accent: PALETTE.amber,
        wear: 0.3,
        threat: 0.35,
        damaged: false,
        recovering: false,
      };
    case "high-risk":
      return {
        state,
        light: 0.55,
        glow: 0.4,
        accent: PALETTE.ember,
        wear: 0.6,
        threat: 0.75,
        damaged: false,
        recovering: false,
      };
    case "damaged":
      return {
        state,
        light: 0.42,
        glow: 0.1,
        accent: "#7a6650",
        wear: 1,
        threat: 0.9,
        damaged: true,
        recovering: false,
      };
    case "recovering":
      return {
        state,
        light: 0.82,
        glow: 1.05,
        accent: PALETTE.amber,
        wear: 0.45,
        threat: 0.15,
        damaged: false,
        recovering: true,
      };
    default:
      return {
        state,
        light: 1,
        glow: 1.5,
        accent: PALETTE.amber,
        wear: 0,
        threat: 0,
        damaged: false,
        recovering: false,
      };
  }
}
