import { useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { DirectionalLight, HemisphereLight, PointLight } from "three";
import type { StateParams } from "./models/state";
import type { SanctuaryTheme } from "./themes";

/**
 * Key / rim / fill lighting matched to the active environment theme, so
 * the clay models pick up the same cast as the backdrop behind them.
 * Intensities ease toward their targets each frame so both risk-state
 * changes and the selection transition (via `presenceRef`) dim smoothly.
 */
export function SceneLighting({
  params,
  theme,
  presenceRef,
}: {
  params: StateParams;
  theme: SanctuaryTheme;
  presenceRef: RefObject<{ value: number }>;
}) {
  const key = useRef<DirectionalLight>(null);
  const rim = useRef<DirectionalLight>(null);
  const hemi = useRef<HemisphereLight>(null);
  const warm = useRef<PointLight>(null);
  const under = useRef<PointLight>(null);
  const ember = useRef<PointLight>(null);

  useFrame((state, dt) => {
    const presence = presenceRef.current?.value ?? 1;
    // Lighting dips to a quarter while a sanctuary dissolves and reforms.
    const m = (0.25 + 0.75 * presence) * params.light;
    const ease = 1 - Math.exp(-4 * dt);
    const move = (light: { intensity: number } | null, target: number) => {
      if (light) light.intensity += (target - light.intensity) * ease;
    };
    // Soft studio light from above, like the clay diorama reference: one
    // warm key casting gentle shadows, broad fill so nothing goes black,
    // and a cool-ish rim to separate the model from the backdrop.
    move(key.current, 2.3 * m);
    move(rim.current, 0.9 * m);
    move(hemi.current, 0.95 * m);
    move(warm.current, 1.1 * params.glow * presence);
    move(under.current, 0.6 * m);
    // Smoldering horizon glow from the smoke side — flickers like firelight.
    // Only wildfire smolders; flood and wind threats stay cold.
    const emberAmount =
      params.hazard === "wildfire" && (params.features?.emberLight ?? true)
        ? params.threat
        : 0;
    const flicker =
      1 + 0.18 * Math.sin(state.clock.getElapsedTime() * 7.3) * emberAmount;
    move(ember.current, emberAmount * 2.4 * presence * flicker);
  });

  return (
    <>
      <hemisphereLight
        ref={hemi}
        color={theme.scene.hemi}
        groundColor={theme.scene.hemiGround}
      />
      <directionalLight
        ref={key}
        color={theme.scene.key}
        position={[3.4, 5.6, 3.2]}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-camera-far={16}
        shadow-bias={-0.0002}
        shadow-normalBias={0.05}
      />
      <directionalLight
        ref={rim}
        color={theme.scene.rim}
        position={[-2.8, 3, -3.6]}
      />
      {/* Accent lantern near the base, in the theme's glow color */}
      <pointLight
        ref={warm}
        color={theme.accent}
        position={[0.6, 0.7, 1.6]}
        distance={5}
      />
      {/* Faint bounce from the backdrop below */}
      <pointLight
        ref={under}
        color={theme.scene.under}
        position={[0, -1.5, 1.4]}
        distance={7}
      />
      {/* Ember glow low on the smoke side, active only under threat */}
      <pointLight
        ref={ember}
        color="#d96536"
        position={[-2.4, 0.6, -1.5]}
        distance={8}
        intensity={0}
      />
    </>
  );
}
