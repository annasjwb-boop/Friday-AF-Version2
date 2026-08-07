import { RoundedBox } from "@react-three/drei";
import { useHomeMaterials } from "./materials";

type OpeningProps = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
};

/**
 * A recessed window: a graphite reveal sunk into the wall with a warm
 * light plane seated just behind its front face. The glow material's
 * emissive intensity is state-driven, so every window on every metaphor
 * responds to the same interior-warmth signal.
 */
export function Window({
  position,
  rotation,
  width = 0.26,
  height = 0.3,
}: OpeningProps) {
  const m = useHomeMaterials();
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox
        args={[width + 0.08, height + 0.08, 0.07]}
        radius={0.02}
        smoothness={4}
        material={m.dark}
        castShadow
      />
      <RoundedBox
        args={[width, height, 0.03]}
        radius={0.012}
        smoothness={4}
        position={[0, 0, 0.012]}
        material={m.glow}
      />
    </group>
  );
}

/** A warm translucent entry: graphite reveal + thick acrylic door slab. */
export function Entry({
  position,
  rotation,
  width = 0.34,
  height = 0.6,
}: OpeningProps) {
  const m = useHomeMaterials();
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox
        args={[width + 0.1, height + 0.08, 0.08]}
        radius={0.025}
        smoothness={4}
        material={m.dark}
        castShadow
      />
      <RoundedBox
        args={[width, height, 0.05]}
        radius={0.02}
        smoothness={4}
        position={[0, 0, 0.02]}
        material={m.glassWarm}
      />
    </group>
  );
}
