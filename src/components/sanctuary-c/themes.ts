import { PALETTE, type StateParams } from "./models/state";

/**
 * Environment themes for Sanctuary 4.C: Polestar studio backdrops. Every
 * theme is a monochrome field — white studio, silver, graphite, carbon —
 * with the signature orange as the single accent; one theme lets the
 * orange itself bleed into the environment. A theme paints the backdrop
 * (eight colors fed into the WebGL mesh-gradient shader) AND relights the
 * 3D scene so the models read as studio-lit bodywork.
 */
export type SanctuaryThemeId =
  | "dusk"
  | "desert"
  | "alpine"
  | "forest"
  | "ocean"
  | "sand";

export interface SanctuaryTheme {
  id: SanctuaryThemeId;
  label: string;
  /**
   * Mesh shader colors, in anchor order: [bright bloom, hue A, hue B,
   * hue C, counter-tone, hue D, dark mass, dark mass]. Positions are
   * fixed in the shader; themes only swap the palette.
   */
  mesh: [string, string, string, string, string, string, string, string];
  /** Deep tone the bottom of the mesh washes toward (seats the panel). */
  meshDeep: string;
  /** Flat fallback fill when WebGL is unavailable. */
  base: string;
  /**
   * Ink to set on top of the mesh. Defaults to dark charcoal; themes deep
   * enough to need it (Forest) flip to light cream ink instead.
   */
  ink?: "light";
  /** Small gradient preview for the picker swatch. */
  swatch: string;
  /** Base fog color the hazard tints lerp away from. */
  fogBase: string;
  /** Scene light colors. */
  scene: {
    hemi: string;
    hemiGround: string;
    key: string;
    rim: string;
    under: string;
  };
  /** The theme's warm accent: windows, lanterns, the slabs' inner warmth,
   *  and the dome's breach edge. */
  accent: string;
}

/**
 * Scene lighting is deliberately neutral studio light for every theme —
 * a clean white key and soft silver fill, like a vehicle reveal — so the
 * models always read as bodywork rather than being washed in theme color.
 * Ground bounce carries the floor's tone, fog matches the air, and the
 * signature orange drives every glow.
 */
export const SANCTUARY_THEMES: SanctuaryTheme[] = [
  {
    id: "dusk",
    label: "Studio",
    // The white reveal floor: a bright bloom falling through porcelain
    // and silver into a soft gray base that seats the panel.
    mesh: [
      "#ffffff", // bloom
      "#f4f4f5", // porcelain
      "#ebebed", // silver-white
      "#e0e0e3", // silver
      "#d4d4d8", // steel (counter)
      "#c9c9cd", // mid silver
      "#b6b6bb", // gray mass
      "#a9a9ae", // gray mass
    ],
    meshDeep: "#98989d",
    base: "#e6e6e8",
    swatch: "linear-gradient(160deg, #ffffff 0%, #dcdcdf 45%, #a5a5aa 100%)",
    fogBase: "#d2d2d6",
    scene: {
      hemi: "#f6f6f7",
      hemiGround: "#96969b",
      key: "#fffdf8",
      rim: "#dfe3e8",
      under: "#bcbcc1",
    },
    accent: "#ff7500",
  },
  {
    id: "desert",
    label: "Carbon",
    // The dark dashboard: near-black tiles with one soft graphite bloom,
    // everything else compressed into carbon. Light ink.
    mesh: [
      "#3d3d41", // graphite bloom
      "#232326", // charcoal
      "#1c1c1f", // carbon
      "#18181a", // carbon
      "#2c2c30", // graphite (counter)
      "#141416", // near-black
      "#0e0e10", // black mass
      "#0a0a0c", // black mass
    ],
    meshDeep: "#070708",
    base: "#121214",
    ink: "light",
    swatch: "linear-gradient(160deg, #3d3d41 0%, #1a1a1d 45%, #070708 100%)",
    fogBase: "#232327",
    scene: {
      hemi: "#c9c9ce",
      hemiGround: "#2c2c30",
      key: "#f4f2ec",
      rim: "#9aa2ac",
      under: "#55555b",
    },
    accent: "#ff7500",
  },
  {
    id: "alpine",
    label: "Silver",
    // Cool metallic silver with the faintest steel-blue cast, like the
    // magnesium paint option.
    mesh: [
      "#ffffff", // ice bloom
      "#eef0f3", // cool white
      "#e2e5e9", // silver
      "#d5d9de", // steel silver
      "#c8ccd2", // steel (counter)
      "#bdc1c7", // mid steel
      "#a8acb3", // steel mass
      "#999da4", // steel mass
    ],
    meshDeep: "#8a8e95",
    base: "#dcdfe3",
    swatch: "linear-gradient(160deg, #f8fafc 0%, #d0d4da 45%, #969aa1 100%)",
    fogBase: "#c6cad0",
    scene: {
      hemi: "#f2f4f6",
      hemiGround: "#8a8e96",
      key: "#fdfcf8",
      rim: "#ccd4dc",
      under: "#aeb2ba",
    },
    accent: "#ff7500",
  },
  {
    id: "forest",
    label: "Graphite",
    // The mid-dark studio: warm-neutral graphite walls with a soft gray
    // bloom — between Studio and Carbon. Light ink.
    mesh: [
      "#77777c", // gray bloom
      "#4c4c51", // graphite
      "#404045", // graphite
      "#38383d", // dark graphite
      "#5a5a5f", // gray (counter)
      "#2e2e33", // charcoal
      "#242428", // charcoal mass
      "#1e1e22", // charcoal mass
    ],
    meshDeep: "#1a1a1e",
    base: "#333338",
    ink: "light",
    swatch: "linear-gradient(160deg, #77777c 0%, #3c3c41 45%, #1a1a1e 100%)",
    fogBase: "#46464b",
    scene: {
      hemi: "#d6d6da",
      hemiGround: "#3c3c41",
      key: "#f7f5f0",
      rim: "#a6aeb8",
      under: "#68686e",
    },
    accent: "#ff7500",
  },
  {
    id: "ocean",
    label: "Signal",
    // The one loud theme: signature orange burning through the top of a
    // carbon field, the way the orange tiles sit on the dark dashboard.
    // Light ink.
    mesh: [
      "#ff8a2e", // orange bloom
      "#e06210", // deep orange
      "#8a3c0a", // burnt orange
      "#3a2010", // ember shadow
      "#2c2c30", // graphite (counter)
      "#1a1512", // near-black
      "#0f0d0c", // black mass
      "#0a0909", // black mass
    ],
    meshDeep: "#070606",
    base: "#1a1310",
    ink: "light",
    swatch: "linear-gradient(160deg, #ff8a2e 0%, #7a3608 45%, #0a0909 100%)",
    fogBase: "#33231a",
    scene: {
      hemi: "#d8cfc8",
      hemiGround: "#33241a",
      key: "#fbf0e4",
      rim: "#b09a8c",
      under: "#6e4a30",
    },
    accent: "#ff7500",
  },
  {
    id: "sand",
    label: "Porcelain",
    // Warm-white studio: the softest of the light fields, ivory instead
    // of blue-silver, for the calmest possible ground.
    mesh: [
      "#fffefb", // ivory bloom
      "#f7f6f2", // warm white
      "#efeee9", // porcelain
      "#e6e5df", // warm silver
      "#dbdad4", // stone (counter)
      "#d0cfc9", // stone
      "#bfbeb8", // stone mass
      "#b2b1ab", // stone mass
    ],
    meshDeep: "#a3a29c",
    base: "#ecebe6",
    swatch: "linear-gradient(160deg, #fffefb 0%, #e2e1db 45%, #aeada7 100%)",
    fogBase: "#d8d7d1",
    scene: {
      hemi: "#f8f7f4",
      hemiGround: "#9a9993",
      key: "#fffdf6",
      rim: "#e2e2dc",
      under: "#c2c1bb",
    },
    accent: "#ff7500",
  },
];

export function getSanctuaryTheme(id: SanctuaryThemeId): SanctuaryTheme {
  return SANCTUARY_THEMES.find((t) => t.id === id) ?? SANCTUARY_THEMES[0];
}

/**
 * Re-accents scene params for a theme. Every warm accent — calm amber and
 * the high-threat ember alike — resolves to the theme's own accent, so the
 * scene stays monochromatic-plus-one-accent on every backdrop. Urgency is
 * carried by behavior (field stutter, weathering, flicker, the breach),
 * never by swapping to an alarm hue that fights the theme. Only the ashen
 * damaged tone stays neutral, because it's already colorless.
 */
export function themedParams(
  params: StateParams,
  theme: SanctuaryTheme,
): StateParams {
  return params.accent === PALETTE.amber || params.accent === PALETTE.ember
    ? { ...params, accent: theme.accent }
    : params;
}
