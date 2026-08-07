import { RoundedBox } from "@react-three/drei";
import { useHomeMaterials } from "../materials";
import { Entry } from "../parts";

/**
 * Bunker: a low, grounded shelter — thick rounded concrete-like forms, one
 * protected opening, and restrained teal guidance lighting. Safe, not
 * militaristic.
 */
export function BunkerHome() {
  const m = useHomeMaterials();
  return (
    <group>
      {/* Main slab with heavy corner radii. */}
      <RoundedBox
        args={[1.82, 0.56, 1.3]}
        radius={0.2}
        smoothness={6}
        position={[0, 0.28, 0]}
        material={m.shell}
        castShadow
        receiveShadow
      />
      {/* Upper slab, stepped back. */}
      <RoundedBox
        args={[1.42, 0.44, 1.0]}
        radius={0.17}
        smoothness={6}
        position={[-0.1, 0.74, -0.08]}
        material={m.shell}
        castShadow
        receiveShadow
      />
      {/* Satin blast lid. */}
      <RoundedBox
        args={[1.1, 0.12, 0.78]}
        radius={0.06}
        smoothness={5}
        position={[-0.1, 0.99, -0.08]}
        material={m.trim}
        castShadow
      />
      {/* Protected entry, deep in the front face. */}
      <Entry position={[0.28, 0.3, 0.63]} width={0.3} height={0.42} />
      {/* Teal guidance strips flanking the approach. */}
      <RoundedBox
        args={[0.045, 0.02, 0.62]}
        radius={0.01}
        position={[0.06, 0.012, 0.98]}
        material={m.accent}
      />
      <RoundedBox
        args={[0.045, 0.02, 0.62]}
        radius={0.01}
        position={[0.5, 0.012, 0.98]}
        material={m.accent}
      />
      {/* Rounded intake vents. */}
      <mesh position={[-0.62, 1.08, -0.28]} material={m.dark} castShadow>
        <cylinderGeometry args={[0.09, 0.11, 0.18, 32]} />
      </mesh>
      <mesh position={[-0.36, 1.08, -0.42]} material={m.dark} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 0.14, 32]} />
      </mesh>
      {/* Low porthole with interior light. */}
      <RoundedBox
        args={[0.34, 0.16, 0.05]}
        radius={0.06}
        position={[-0.52, 0.34, 0.63]}
        material={m.glow}
      />
    </group>
  );
}
