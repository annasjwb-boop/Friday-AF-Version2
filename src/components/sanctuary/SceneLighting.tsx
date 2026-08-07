import { useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { DirectionalLight, HemisphereLight, PointLight } from "three";
import type { StateParams } from "./models/state";

/**
 * Warm-key / cool-rim lighting matched to the cream-into-cocoa backdrop.
 * Intensities ease toward their targets each frame so both risk-state
 * changes and the selection transition (via `presenceRef`) dim smoothly.
 */
export function SceneLighting({
  params,
  presenceRef,
}: {
  params: StateParams;
  presenceRef: RefObject<{ value: number }>;
}) {
  const key = useRef<DirectionalLight>(null);
  const rim = useRef<DirectionalLight>(null);
  const hemi = useRef<HemisphereLight>(null);
  const warm = useRef<PointLight>(null);
  const under = useRef<PointLight>(null);

  useFrame((_, dt) => {
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
  });

  return (
    <>
      <hemisphereLight ref={hemi} color="#c5bdae" groundColor="#4e5058" />
      <directionalLight
        ref={key}
        color="#f8f2e2"
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
      <directionalLight ref={rim} color="#aeb8c8" position={[-2.8, 3, -3.6]} />
      {/* Warm accent lantern near the base */}
      <pointLight ref={warm} color="#e8a35c" position={[0.6, 0.7, 1.6]} distance={5} />
      {/* Faint slate bounce from the dusk backdrop below */}
      <pointLight ref={under} color="#9aa4b4" position={[0, -1.5, 1.4]} distance={7} />
    </>
  );
}
