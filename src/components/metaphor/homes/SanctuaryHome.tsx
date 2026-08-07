import { RoundedBox } from "@react-three/drei";
import { useHomeMaterials } from "../materials";
import { Entry, Window } from "../parts";

/**
 * Sanctuary: a compact modern home wrapped by a taller protective shell on
 * its weather side, with a warm translucent entry and a calm interior glow.
 */
export function SanctuaryHome() {
  const m = useHomeMaterials();
  return (
    <group>
      {/* Main volume. */}
      <RoundedBox
        args={[1.5, 0.95, 1.1]}
        radius={0.07}
        smoothness={5}
        position={[0.1, 0.475, 0]}
        material={m.shell}
        castShadow
        receiveShadow
      />
      {/* Floating roof slab with a slight overhang. */}
      <RoundedBox
        args={[1.68, 0.13, 1.28]}
        radius={0.055}
        smoothness={5}
        position={[0.1, 1.01, 0]}
        material={m.dark}
        castShadow
      />
      {/* Protective outer shell: an L-shaped wing wrapping the back-left. */}
      <RoundedBox
        args={[0.16, 1.34, 1.36]}
        radius={0.07}
        smoothness={5}
        position={[-0.78, 0.67, -0.04]}
        material={m.trim}
        castShadow
        receiveShadow
      />
      <RoundedBox
        args={[1.05, 1.34, 0.16]}
        radius={0.07}
        smoothness={5}
        position={[-0.33, 0.67, -0.68]}
        material={m.trim}
        castShadow
        receiveShadow
      />
      {/* Warm translucent entry, recessed on the front face. */}
      <Entry position={[-0.22, 0.34, 0.53]} />
      {/* Living windows. */}
      <Window position={[0.42, 0.52, 0.53]} width={0.42} height={0.34} />
      <Window
        position={[0.83, 0.5, 0.16]}
        rotation={[0, Math.PI / 2, 0]}
        width={0.3}
        height={0.3}
      />
      {/* Skylight seam on the roof. */}
      <RoundedBox
        args={[0.5, 0.02, 0.16]}
        radius={0.008}
        position={[0.38, 1.08, -0.2]}
        material={m.glassWarm}
      />
    </group>
  );
}
