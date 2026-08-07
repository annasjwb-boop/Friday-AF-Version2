import { RoundedBox } from "@react-three/drei";
import { useHomeMaterials } from "../materials";
import { Entry, Window } from "../parts";

/**
 * Floating sky building: a lit capsule lofted on a slim pedestal, with an
 * underglow rim that reads as hovering. No clouds or sky scenery.
 */
export function SkyHome() {
  const m = useHomeMaterials();
  return (
    <group>
      {/* Pedestal. */}
      <mesh position={[0, 0.2, 0]} material={m.trim} castShadow receiveShadow>
        <cylinderGeometry args={[0.38, 0.48, 0.4, 48]} />
      </mesh>
      <mesh position={[0, 0.52, 0]} material={m.dark} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 0.28, 32]} />
      </mesh>
      {/* Floating volume. */}
      <RoundedBox
        args={[1.55, 0.72, 1.1]}
        radius={0.12}
        smoothness={6}
        position={[0, 1.15, 0]}
        material={m.shell}
        castShadow
        receiveShadow
      />
      <RoundedBox
        args={[1.62, 0.08, 1.18]}
        radius={0.04}
        smoothness={5}
        position={[0, 1.55, 0]}
        material={m.dark}
        castShadow
      />
      {/* Underglow rim. */}
      <mesh position={[0, 0.78, 0]} material={m.glow}>
        <torusGeometry args={[0.72, 0.025, 12, 48]} />
      </mesh>
      <mesh position={[0, 0.78, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.glow}>
        <ringGeometry args={[0.55, 0.78, 48]} />
      </mesh>
      <Entry position={[-0.35, 1.05, 0.54]} width={0.28} height={0.42} />
      <Window position={[0.35, 1.18, 0.54]} width={0.48} height={0.34} />
      <Window
        position={[0.76, 1.18, 0]}
        rotation={[0, Math.PI / 2, 0]}
        width={0.42}
        height={0.34}
      />
    </group>
  );
}
