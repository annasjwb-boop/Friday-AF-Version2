import { RoundedBox } from "@react-three/drei";
import { useHomeMaterials } from "../materials";
import { Entry, Window } from "../parts";

/**
 * Lighthouse: a broad tapered tower with an illuminated crown, an attached
 * keeper's shelter, and a stable geometric base. No coastal scenery — the
 * plinth is the shore.
 */
export function LighthouseHome() {
  const m = useHomeMaterials();
  return (
    <group>
      {/* Stable base course. */}
      <RoundedBox
        args={[1.14, 0.3, 1.14]}
        radius={0.08}
        smoothness={5}
        position={[-0.25, 0.15, -0.1]}
        material={m.trim}
        castShadow
        receiveShadow
      />
      {/* Tapered tower. */}
      <mesh position={[-0.25, 1.05, -0.1]} material={m.shell} castShadow receiveShadow>
        <cylinderGeometry args={[0.32, 0.46, 1.5, 48]} />
      </mesh>
      {/* Satin bands. */}
      <mesh position={[-0.25, 0.72, -0.1]} material={m.trim} castShadow>
        <cylinderGeometry args={[0.435, 0.445, 0.09, 48]} />
      </mesh>
      <mesh position={[-0.25, 1.38, -0.1]} material={m.trim} castShadow>
        <cylinderGeometry args={[0.355, 0.365, 0.09, 48]} />
      </mesh>
      {/* Illuminated crown: emissive core inside a translucent drum. */}
      <mesh position={[-0.25, 1.93, -0.1]} material={m.glow} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.28, 32]} />
      </mesh>
      <mesh position={[-0.25, 1.93, -0.1]} material={m.glassCool}>
        <cylinderGeometry args={[0.3, 0.3, 0.34, 48]} />
      </mesh>
      {/* Graphite cap. */}
      <mesh position={[-0.25, 2.16, -0.1]} material={m.dark} castShadow>
        <cylinderGeometry args={[0.13, 0.34, 0.2, 48]} />
      </mesh>
      {/* Tower window. */}
      <Window
        position={[-0.25, 1.06, 0.31]}
        width={0.16}
        height={0.28}
      />
      {/* Attached keeper's shelter. */}
      <RoundedBox
        args={[0.74, 0.52, 0.62]}
        radius={0.06}
        smoothness={5}
        position={[0.62, 0.26, 0.32]}
        material={m.shell}
        castShadow
        receiveShadow
      />
      <RoundedBox
        args={[0.84, 0.09, 0.72]}
        radius={0.04}
        smoothness={5}
        position={[0.62, 0.55, 0.32]}
        material={m.dark}
        castShadow
      />
      <Entry position={[0.62, 0.24, 0.64]} width={0.24} height={0.38} />
    </group>
  );
}
