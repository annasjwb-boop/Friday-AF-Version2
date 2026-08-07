import { RoundedBox } from "@react-three/drei";
import { useHomeMaterials } from "../materials";
import { Entry, Window } from "../parts";

/**
 * Treehouse: an elevated home carried by one sculptural trunk, with rounded
 * platforms, a warm translucent interior, and a single soft canopy form —
 * no literal leaves.
 */
export function TreehouseHome() {
  const m = useHomeMaterials();
  return (
    <group>
      {/* Sculptural trunk. */}
      <mesh position={[0, 0.55, 0]} material={m.wood} castShadow receiveShadow>
        <cylinderGeometry args={[0.17, 0.3, 1.1, 40]} />
      </mesh>
      {/* Root flare grounding the trunk. */}
      <mesh position={[0, 0.07, 0]} material={m.wood} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.42, 0.14, 40]} />
      </mesh>
      {/* Main platform: two stacked discs read as a beveled deck. */}
      <mesh position={[0, 1.12, 0]} material={m.trim} castShadow receiveShadow>
        <cylinderGeometry args={[0.78, 0.74, 0.09, 48]} />
      </mesh>
      <mesh position={[0, 1.18, 0]} material={m.wood} receiveShadow>
        <cylinderGeometry args={[0.72, 0.72, 0.04, 48]} />
      </mesh>
      {/* Lower lookout platform on its own slender post. */}
      <mesh position={[0.62, 0.68, 0.42]} material={m.trim} castShadow>
        <cylinderGeometry args={[0.3, 0.27, 0.07, 40]} />
      </mesh>
      <mesh position={[0.62, 0.33, 0.42]} material={m.wood} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 0.66, 24]} />
      </mesh>
      {/* Cabin volume. */}
      <RoundedBox
        args={[0.88, 0.56, 0.72]}
        radius={0.07}
        smoothness={5}
        position={[-0.08, 1.48, -0.08]}
        material={m.shell}
        castShadow
        receiveShadow
      />
      <RoundedBox
        args={[1.0, 0.09, 0.84]}
        radius={0.04}
        smoothness={5}
        position={[-0.08, 1.79, -0.08]}
        material={m.dark}
        castShadow
      />
      <Entry position={[0.06, 1.44, 0.29]} width={0.22} height={0.38} />
      <Window
        position={[-0.53, 1.5, -0.08]}
        rotation={[0, -Math.PI / 2, 0]}
        width={0.24}
        height={0.24}
      />
      {/* One soft canopy form behind the cabin. */}
      <mesh position={[0.44, 1.98, -0.42]} material={m.plant} castShadow>
        <sphereGeometry args={[0.4, 32, 24]} />
      </mesh>
    </group>
  );
}
