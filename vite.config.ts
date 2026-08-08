import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

/** The project's custom style, used when nothing else supplies one. */
const DEFAULT_STYLE = "mapbox://styles/argtlsj85/cmjesqgz3001y01s1gx990dix";

/**
 * Mapbox config is resolved here rather than read straight from
 * import.meta.env, because the value lives in a Vercel shared variable named
 * `MapBoxBluePurple` — and Vite only exposes `VITE_`-prefixed vars to client
 * code, so it would never reach the browser otherwise.
 *
 * The name doesn't say whether it holds a token or a style URL, so both are
 * sorted by shape: `pk.…` is a token, `mapbox://…` is a style. That also means
 * renaming the variable, or pointing it at the other value, keeps working.
 */
function resolveMapbox(env: Record<string, string | undefined>) {
  const candidates = [
    env.MapBoxBluePurple,
    env.VITE_MAPBOX_TOKEN,
    env.MAPBOX_TOKEN,
    env.VITE_MAPBOX_STYLE,
    env.MAPBOX_STYLE,
  ].filter((v): v is string => typeof v === "string" && v.length > 0);

  return {
    token: candidates.find((v) => v.startsWith("pk.")) ?? "",
    style: candidates.find((v) => v.startsWith("mapbox://")) ?? DEFAULT_STYLE,
  };
}

export default defineConfig(({ mode }) => {
  // The empty prefix loads every variable, not just VITE_ ones, so the shared
  // Vercel variable is visible here. Only the two values below are forwarded
  // into the bundle — nothing else is exposed by widening the prefix.
  const env = {
    ...loadEnv(mode, process.cwd(), ""),
    ...process.env,
  } as Record<string, string | undefined>;

  const mapbox = resolveMapbox(env);

  // Surfaces in the Vercel build log, so a missing token is visible at build
  // time rather than as a blank map after deploy.
  console.log(
    `[mapbox] token ${mapbox.token ? "resolved" : "MISSING — map will fall back to the SVG silhouette"}; style ${mapbox.style}`,
  );

  return {
    plugins: [react()],
    define: {
      __MAPBOX_TOKEN__: JSON.stringify(mapbox.token),
      __MAPBOX_STYLE__: JSON.stringify(mapbox.style),
    },
  };
});
