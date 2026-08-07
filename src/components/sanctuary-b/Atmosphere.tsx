import { useMemo } from "react";
import { Color } from "three";
import { Sparkles } from "@react-three/drei";
import type { HazardType } from "../../types/sanctuary";
import type { StateParams } from "./models/state";
import type { SanctuaryTheme } from "./themes";
import { ParticleDrift } from "./models/particles";

/** Where the fog drifts as each hazard's threat climbs. */
const HAZARD_FOG: Record<HazardType, string> = {
  wildfire: "#54413a", // smoky umber
  flood: "#33434f", // waterlogged slate blue
  wind: "#3d463f", // storm-front gray-green
  quake: "#4a4238", // dust-choked tan
  winter: "#48525e", // icy blue-gray
};

/**
 * Fog and environmental particles, typed by hazard. Fog starts from the
 * active theme's midtone so the far edges of each model melt into the
 * backdrop, and shifts toward the hazard's own cast as threat climbs:
 * smoky umber for wildfire (with embers), waterlogged blue for flood (with
 * rain), storm gray-green for wind (with streaming debris). Missing profile
 * information pulls the fog closer — unknown reads as hazy, never damaged.
 */
export function Atmosphere({
  params,
  theme,
  reducedMotion,
}: {
  params: StateParams;
  theme: SanctuaryTheme;
  reducedMotion: boolean;
}) {
  // Known-low risk is good news, not absence: the air clears, the fog
  // lifts and pulls back, and warm fireflies drift around the sanctuary.
  // Only when risk is actually known — unknown stays hazy.
  const calm =
    params.personalized && !params.unknown.risk && params.threat < 0.34;
  const fogNear = (calm ? 7.2 : 5.5) - params.unknownFog * 2.6;
  const fogFar = (calm ? 14.5 : 11.5) - params.unknownFog * 4.8;
  const tint = (params.features?.fogTint ?? true) ? params.threat : 0;
  const hazardFog = HAZARD_FOG[params.hazard];
  const fogBase = theme.fogBase;
  const fogColor = useMemo(
    () =>
      calm
        ? // Clear air: the theme fog lifted slightly toward daylight.
          new Color(fogBase).lerp(new Color("#ffffff"), 0.09).getStyle()
        : new Color(fogBase).lerp(new Color(hazardFog), tint * 0.85).getStyle(),
    [tint, hazardFog, calm, fogBase],
  );
  const embersOn =
    params.hazard === "wildfire" &&
    (params.features?.embers ?? params.threat > 0.45);
  const rainOn = params.hazard === "flood" && params.threat > 0.25;
  const debrisOn = params.hazard === "wind" && params.threat > 0.25;
  const dustOn = params.hazard === "quake" && params.threat > 0.3;
  const snowOn = params.hazard === "winter" && params.threat > 0.2;
  return (
    <>
      <fog attach="fog" args={[fogColor, fogNear, fogFar]} />
      {!reducedMotion && (
        <>
          <Sparkles
            count={36}
            scale={[5.5, 3.2, 5.5]}
            position={[0, 1.2, 0]}
            size={1.6}
            speed={0.22}
            opacity={0.32}
            color="#e9cfa4"
          />
          {/* Embers thicken and climb as the fire threat climbs */}
          {embersOn && (
            <>
              <Sparkles
                count={Math.round(10 + params.threat * 30)}
                scale={[3.4, 1.4, 3.4]}
                position={[0, 0.5, 0]}
                size={2.4}
                speed={0.55}
                opacity={0.6}
                color="#d96536"
              />
              <Sparkles
                count={Math.round(6 + params.threat * 14)}
                scale={[4.4, 2.6, 4.4]}
                position={[0, 1.6, 0]}
                size={1.8}
                speed={0.4}
                opacity={0.4}
                color="#e8845c"
              />
            </>
          )}
          {/* Rain sheets down over the whole diorama during flood threat */}
          {rainOn && (
            <ParticleDrift
              p={[0.2, 2.6, 0]}
              count={340}
              dir={[0.16, -1, 0]}
              dist={3.2}
              spread={[2.3, 0.2, 2.3]}
              size={[0.05, 0]}
              speed={0.7}
              turbulence={0.015}
              color="#b9cdd9"
              opacity={0.35 + params.threat * 0.45}
            />
          )}
          {/* Debris streams sideways across the scene in a windstorm */}
          {debrisOn && (
            <ParticleDrift
              p={[-2.3, 1.0, 0.2]}
              count={150}
              dir={[1, 0.06, 0.12]}
              dist={4.6}
              spread={[0.5, 1.1, 1.7]}
              size={[0.06, 0.04]}
              speed={0.4}
              turbulence={0.3}
              color="#aaa892"
              opacity={0.3 + params.threat * 0.4}
            />
          )}
          {/* Clear skies: fireflies drift lazily around a safe sanctuary */}
          {calm && (
            <ParticleDrift
              p={[0, 0.65, 0]}
              count={40}
              dir={[0.05, 0.24, 0.03]}
              dist={0.9}
              spread={[1.8, 0.5, 1.8]}
              size={[0.05, 0.03]}
              speed={0.07}
              turbulence={0.2}
              color="#ffe9b8"
              opacity={0.55}
              additive
            />
          )}
          {/* Dust shaken loose drifts up from the ground during tremors */}
          {dustOn && (
            <ParticleDrift
              p={[0, 0.08, 0]}
              count={90}
              dir={[0.35, 0.4, 0.15]}
              dist={1.0}
              spread={[1.7, 0.06, 1.7]}
              size={[0.14, 0.5]}
              speed={0.12}
              turbulence={0.1}
              color="#8d8171"
              opacity={0.1 + params.threat * 0.14}
            />
          )}
          {/* Snow falls slow and fluttering through a winter storm */}
          {snowOn && (
            <ParticleDrift
              p={[0, 2.4, 0]}
              count={260}
              dir={[0.1, -1, 0.04]}
              dist={2.9}
              spread={[2.4, 0.2, 2.4]}
              size={[0.055, 0.02]}
              speed={0.09}
              turbulence={0.22}
              color="#e9eef4"
              opacity={0.4 + params.threat * 0.35}
            />
          )}
          {/* Fine glowing motes accompany recovery, in the theme accent */}
          {params.recovering && (
            <Sparkles
              count={20}
              scale={[2.4, 2.2, 2.4]}
              position={[0, 0.9, 0]}
              size={1.8}
              speed={0.35}
              opacity={0.5}
              color={theme.accent}
            />
          )}
        </>
      )}
    </>
  );
}
