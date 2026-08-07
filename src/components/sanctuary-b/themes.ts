import { PALETTE, type StateParams } from "./models/state";

/**
 * Environment themes for Sanctuary 4.b: natural mesh-gradient moods the
 * user picks to fit their vibe. A theme paints the backdrop (eight colors
 * fed into the WebGL mesh-gradient shader) AND relights the 3D scene —
 * fog, ground bounce, and the warm accent used for glows — so the clay
 * models sit in the same world as the mesh behind them.
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
 * Scene lighting is deliberately near-neutral daylight for every theme —
 * warm sun key, soft white sky fill — so the clay models always read as
 * sculpture rather than being washed in theme color. The environment only
 * reaches the model the way it would physically: ground bounce carries
 * the terrain's tone (sand, moss, snow, dune), fog matches the air, and
 * the accent drives the glows.
 */
export const SANCTUARY_THEMES: SanctuaryTheme[] = [
  {
    id: "dusk",
    label: "Dusk",
    mesh: [
      "#fffaf0", // bloom
      "#e2762a", // ember orange
      "#f4b878", // apricot
      "#b2869a", // mauve-plum
      "#7488a6", // slate blue (counter)
      "#a89c8c", // warm taupe
      "#7e6876", // plum-gray mass
      "#4a4440", // charcoal mass
    ],
    meshDeep: "#6e6558",
    base: "#b6ada0",
    swatch: "linear-gradient(160deg, #f6ecd9 0%, #d99a5e 45%, #8b8272 100%)",
    fogBase: "#a49a8c",
    scene: {
      hemi: "#f1ece2",
      hemiGround: "#8a8274",
      key: "#fff6e6",
      rim: "#ccd2da",
      under: "#b0a896",
    },
    accent: "#e8a35c",
  },
  {
    id: "desert",
    label: "Desert",
    mesh: [
      "#fffdf6", // white-hot bloom
      "#f6941e", // saffron
      "#f06a34", // coral
      "#ce5216", // burnt orange
      "#98a890", // sage (counter)
      "#b24e1e", // rust
      "#de906a", // dusty rose
      "#723e20", // umber mass
    ],
    meshDeep: "#966640",
    base: "#e3c9a8",
    swatch: "linear-gradient(160deg, #fdf6e8 0%, #e0873c 45%, #a4764a 100%)",
    fogBase: "#cfae88",
    scene: {
      hemi: "#f6ecdd",
      hemiGround: "#a8825c",
      key: "#fff4e2",
      rim: "#dcc6ac",
      under: "#c8a67c",
    },
    accent: "#e88f3c",
  },
  {
    id: "alpine",
    label: "Alpine",
    mesh: [
      "#ffffff", // ice bloom
      "#7aaada", // sky steel
      "#988cc8", // lavender
      "#6cb4be", // glacier teal
      "#b4a492", // warm granite (counter)
      "#547ab4", // cornflower
      "#706e9c", // dusk violet mass
      "#3e526c", // pine slate mass
    ],
    meshDeep: "#6e7e91",
    base: "#d6dde4",
    swatch: "linear-gradient(160deg, #f4f8fc 0%, #8faec9 45%, #7e8e9e 100%)",
    fogBase: "#b7c3ce",
    scene: {
      hemi: "#eef2f6",
      hemiGround: "#7e8ea0",
      key: "#fdf9ef",
      rim: "#c4d4e4",
      under: "#a4b4c4",
    },
    accent: "#6da7dc",
  },
  {
    id: "forest",
    label: "Forest",
    // Earthy serenity: one creamy butter bloom held to the top corner,
    // everything else a narrow band of clean deep greens. The old pale
    // butter counter-tone smeared down the left and turned the midfield
    // olive; a soft moss-sage counter keeps the field green. Cream ink.
    mesh: [
      "#f2eecb", // cream-butter bloom
      "#4a5e3f", // deep green
      "#5e7350", // mid moss
      "#44583c", // deep green
      "#96a878", // soft moss-sage (counter)
      "#546a4a", // moss
      "#38492f", // dark pine mass
      "#2f3e29", // dark pine mass
    ],
    meshDeep: "#3c4a34",
    base: "#54654a",
    ink: "light",
    swatch: "linear-gradient(160deg, #f2eecb 0%, #556b4a 45%, #37452f 100%)",
    fogBase: "#7c8a68",
    scene: {
      hemi: "#e9edd8",
      hemiGround: "#5c6a4a",
      key: "#fbf3d8",
      rim: "#aebfa0",
      under: "#8a9a72",
    },
    accent: "#e0c374",
  },
  {
    id: "ocean",
    label: "Beach",
    // Hazy seafoam and ocean teal with a warm apricot ribbon glowing
    // through the top, deepening to ocean blue below. Cream ink on top.
    mesh: [
      "#f6f0d4", // pale butter bloom
      "#f2e4b4", // warm cream
      "#f0a860", // apricot ribbon
      "#7ec4b4", // seafoam
      "#a4b894", // sage (counter)
      "#5aa8ac", // airy teal
      "#3a7e96", // ocean teal mass
      "#2c5f86", // deep ocean blue mass
    ],
    meshDeep: "#2b5876",
    base: "#6faab0",
    ink: "light",
    swatch: "linear-gradient(160deg, #f6f0d4 0%, #5aa8ac 45%, #2b5876 100%)",
    fogBase: "#8fb6b2",
    scene: {
      hemi: "#eaf2ec",
      hemiGround: "#4e7a80",
      key: "#fff4dc",
      rim: "#a8d4d0",
      under: "#7aa8a8",
    },
    accent: "#f2a45c",
  },
  {
    id: "sand",
    label: "Sand",
    // Glowing ivory light melting through caramel and coffee into
    // near-black chocolate at the base. Cream ink on top.
    mesh: [
      "#fdf6e2", // ivory bloom
      "#f8efd8", // ivory (carries the glow across the whole top)
      "#f0dfb8", // warm cream-tan
      "#b07a42", // caramel
      "#c99a5e", // light caramel
      "#7a4f28", // coffee
      "#3d2817", // dark chocolate mass
      "#2a1b10", // near-black mass
    ],
    meshDeep: "#241708",
    base: "#8a643c",
    ink: "light",
    swatch: "linear-gradient(160deg, #fdf6e2 0%, #a06c38 50%, #241708 100%)",
    fogBase: "#9a7a52",
    scene: {
      hemi: "#f4ead6",
      hemiGround: "#6e4e2e",
      key: "#fff3da",
      rim: "#d8c2a0",
      under: "#b08a5c",
    },
    accent: "#e8b45c",
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
