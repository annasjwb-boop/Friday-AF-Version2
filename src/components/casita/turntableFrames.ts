/**
 * Product-render turntable frames, discovered via Vite glob.
 * Drop PNGs at src/assets/metaphors/turntable/{type}/{angle}.png
 * where angle is degrees (000, 045, 090, …). Any angles present are used,
 * sorted clockwise from the hero shot.
 */
const modules = import.meta.glob<{ default: string }>(
  "../../assets/metaphors/turntable/*/*.png",
  { eager: true },
);

export function getTurntableFrames(type: string): string[] {
  const prefix = `../../assets/metaphors/turntable/${type}/`;
  return Object.entries(modules)
    .filter(([key]) => key.startsWith(prefix))
    .map(([key, mod]) => {
      const file = key.slice(prefix.length);
      const angle = Number.parseInt(file.replace(/\.png$/i, ""), 10);
      return { angle, url: mod.default };
    })
    .filter((entry) => Number.isFinite(entry.angle) && entry.url)
    .sort((a, b) => a.angle - b.angle)
    .map((entry) => entry.url);
}
