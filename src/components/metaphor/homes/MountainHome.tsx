import { RoundedBox } from "@react-three/drei";
import { useHomeMaterials } from "../materials";
import { Entry, Window } from "../parts";

/**
 * Mountain home: a compact alpine refuge — heavy pitched roof overhang,
 * pale wood accents, graphite glazing, warm interior. No literal peaks.
 */
export function MountainHome() {
  const m = useHomeMaterials();
  return (
    <group>
      <RoundedBox
        args={[1.7, 0.28, 1.2]}
        radius={0.08}
        smoothness={5}
        position={[0, 0.14, 0]}
        material={m.stone}
        castShadow
        receiveShadow
      />
      <RoundedBox
        args={[1.5, 0.72, 1.0]}
        radius={0.06}
        smoothness={5}
        position={[0, 0.64, 0.02]}
        material={m.shell}
        castShadow
        receiveShadow
      />
      <RoundedBox
        args={[0.42, 0.72, 1.0]}
        radius={0.05}
        smoothness={5}
        position={[-0.7, 0.64, 0.02]}
        material={m.wood}
        castShadow
      />
      {/* Heavy alpine roof overhang. */}
      <mesh
        position={[0, 1.28, 0]}
        rotation={[0, 0, 0]}
        material={m.shell}
        castShadow
      >
        <boxGeometry args={[2.05, 0.18, 1.55]} />
      </mesh>
      <mesh position={[0, 1.42, 0]} rotation={[0, Math.PI / 4, 0]} material={m.trim} castShadow>
        <boxGeometry args={[1.55, 0.22, 1.55]} />
      </mesh>
      <Entry position={[0.22, 0.42, 0.5]} width={0.28} height={0.48} />
      <Window position={[-0.45, 0.7, 0.5]} width={0.36} height={0.32} />
      <RoundedBox
        args={[1.2, 0.018, 0.018]}
        radius={0.006}
        position={[0, 0.03, 0.62]}
        material={m.glow}
      />
    </group>
  );
}
