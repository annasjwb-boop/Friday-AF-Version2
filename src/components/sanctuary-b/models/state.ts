import type {
  HazardType,
  RiskState,
  SanctuaryProfile,
} from "../../../types/sanctuary";

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

/** Which of the four profile dimensions are still missing. */
export interface UnknownDimensions {
  risk: boolean;
  readiness: boolean;
  coverage: boolean;
  recovery: boolean;
}

/**
 * Demo-only visibility switches: turning a channel off removes its visuals
 * entirely (back to the pristine baseline for that channel), so each
 * dimension's contribution to the scene can be inspected in isolation.
 */
export interface ChannelToggles {
  risk: boolean;
  readiness: boolean;
  coverage: boolean;
  recovery: boolean;
}

export const ALL_CHANNELS: ChannelToggles = {
  risk: true,
  readiness: true,
  coverage: true,
  recovery: true,
};

/**
 * Scalar knobs derived from the risk state. Models interpret these in their
 * own vocabulary (cracks, water level, fractured crystals, missing bridges).
 *
 * Each profile dimension owns one visual channel:
 * - Risk → the environment (threat, light, smoke)
 * - Readiness → the structure's condition (wear, glow)
 * - Coverage → the protective boundary around the diorama
 * - Recovery → the pathways and beacon leading back home
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
  /** Which environmental kit the threat renders as. */
  hazard: HazardType;
  damaged: boolean;
  recovering: boolean;
  /**
   * Structural completeness driven by readiness. The architecture itself
   * changes: 0 = half-built (scaffolding, missing towers), 1 = modest,
   * 2 = the pristine archetype, 3 = fortified (turrets, banners, braziers).
   */
  tier: 0 | 1 | 2 | 3;
  /** True in the risk view, where the profile channels drive the scene. */
  personalized: boolean;
  /** Covered fraction of the protective boundary (0..1); null = unknown. */
  boundary: number | null;
  /** Recovery pathway readiness (0..1); null = unknown. */
  pathway: number | null;
  /** Extra fog for missing information (0..1). Unknown is hazy, not damaged. */
  unknownFog: number;
  unknown: UnknownDimensions;
  /**
   * Per-effect overrides used by the lab screen. Undefined means automatic
   * (each effect follows its normal threat-driven behavior).
   */
  features?: {
    embers?: boolean;
    emberLight?: boolean;
    fogTint?: boolean;
  };
}

const NO_UNKNOWNS: UnknownDimensions = {
  risk: false,
  readiness: false,
  coverage: false,
  recovery: false,
};

/** Channel defaults for the non-personalized (showroom) states. */
const BASE_CHANNELS = {
  tier: 2 as const,
  hazard: "wildfire" as const,
  personalized: false,
  boundary: null,
  pathway: null,
  unknownFog: 0,
  unknown: NO_UNKNOWNS,
} as const;

/** Readiness score → structural completeness tier. */
function readinessTier(readiness: number): 0 | 1 | 2 | 3 {
  if (readiness >= 90) return 3;
  if (readiness >= 70) return 2;
  if (readiness >= 40) return 1;
  return 0;
}

/**
 * Derives the scene knobs from a user's four-dimension profile. Missing
 * information maps to fog and withheld geometry — never to damage. Actual
 * structural damage only appears after a confirmed disaster. A muted
 * channel (demo toggles) contributes nothing: its visuals revert to the
 * pristine baseline so the remaining channels can be read in isolation.
 */
export function profileParams(
  profile: SanctuaryProfile,
  channels: ChannelToggles = ALL_CHANNELS,
): StateParams {
  const unknown: UnknownDimensions = {
    risk: channels.risk && profile.risk === null,
    readiness: channels.readiness && profile.readiness === null,
    coverage: channels.coverage && profile.coverage === null,
    recovery: channels.recovery && profile.recovery === null,
  };
  const unknownCount = Object.values(unknown).filter(Boolean).length;

  // Risk drives the environment. Unknown risk means calm skies plus haze.
  const threat =
    !channels.risk || profile.risk === null ? 0 : (profile.risk as number) / 100;
  // Readiness drives the structure. Unknown readiness stays neutral.
  const readinessOff = !channels.readiness || profile.readiness === null;
  const readiness = readinessOff ? 65 : (profile.readiness as number);
  const wear = readinessOff
    ? 0
    : Math.min(1, (1 - readiness / 100) * 1.15);
  const glow = readinessOff ? 1.0 : 0.25 + (readiness / 100) * 1.7;
  // Unknown readiness keeps the neutral archetype silhouette — missing
  // information never makes the sanctuary look unbuilt or weak.
  const tier = readinessOff ? 2 : readinessTier(readiness);

  const boundary =
    !channels.coverage || profile.coverage === null
      ? null
      : (profile.coverage as number) / 100;
  const pathway =
    !channels.recovery || profile.recovery === null
      ? null
      : (profile.recovery as number) / 100;

  if (profile.confirmedDamage) {
    return {
      state: "damaged",
      light: 0.42,
      glow: 0.1,
      accent: "#7a6650",
      wear: 1,
      threat: Math.max(threat, 0.75),
      hazard: profile.hazard,
      damaged: true,
      recovering: false,
      tier,
      personalized: true,
      boundary,
      pathway,
      unknownFog: Math.min(1, unknownCount * 0.28),
      unknown,
    };
  }

  return {
    state: threat > 0.6 ? "high-risk" : threat > 0.3 ? "vulnerable" : "healthy",
    light: 1 - threat * 0.52,
    glow,
    accent: threat > 0.6 ? PALETTE.ember : PALETTE.amber,
    wear,
    threat,
    hazard: profile.hazard,
    damaged: false,
    recovering: false,
    tier,
    personalized: true,
    boundary,
    pathway,
    unknownFog: Math.min(1, unknownCount * 0.28),
    unknown,
  };
}

export function stateParams(state: RiskState): StateParams {
  switch (state) {
    case "vulnerable":
      return {
        ...BASE_CHANNELS,
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
        ...BASE_CHANNELS,
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
        ...BASE_CHANNELS,
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
        ...BASE_CHANNELS,
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
        ...BASE_CHANNELS,
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
