import { RoundedBox } from "@react-three/drei";
import { useHomeMaterials } from "../materials";
import { Entry } from "../parts";

/**
 * Castle: a contemporary fortress — three broad tower drums, thick
 * connecting walls, and one protected central opening. No crenellation,
 * no medieval ornament.
 */
export function CastleHome() {
  const m = useHomeMaterials();
  return (
    <group>
      {/* Tower drums. */}
      <mesh position={[-0.68, 0.72, -0.32]} material={m.shell} castShadow receiveShadow>
        <cylinderGeometry args={[0.44, 0.46, 1.44, 48]} />
      </mesh>
      <mesh position={[0.62, 0.86, -0.42]} material={m.shell} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.52, 1.72, 48]} />
      </mesh>
      <mesh position={[0.05, 0.56, 0.55]} material={m.shell} castShadow receiveShadow>
        <cylinderGeometry args={[0.36, 0.38, 1.12, 48]} />
      </mesh>
      {/* Satin caps give each drum a finished top edge. */}
      <mesh position={[-0.68, 1.47, -0.32]} material={m.trim} castShadow>
        <cylinderGeometry args={[0.47, 0.47, 0.08, 48]} />
      </mesh>
      <mesh position={[0.62, 1.75, -0.42]} material={m.trim} castShadow>
        <cylinderGeometry args={[0.53, 0.53, 0.08, 48]} />
      </mesh>
      <mesh position={[0.05, 1.15, 0.55]} material={m.trim} castShadow>
        <cylinderGeometry args={[0.39, 0.39, 0.08, 48]} />
      </mesh>
      {/* Thick curtain wall binding the drums. */}
      <RoundedBox
        args={[1.5, 0.78, 0.5]}
        radius={0.09}
        smoothness={5}
        position={[0, 0.39, -0.1]}
        material={m.trim}
        castShadow
        receiveShadow
      />
      {/* Protected central opening, deep-set in the wall. */}
      <Entry position={[-0.52, 0.34, 0.14]} width={0.3} height={0.52} />
      {/* Slit windows on the tall drum. */}
      <RoundedBox
        args={[0.09, 0.4, 0.05]}
        radius={0.02}
        position={[0.62, 1.12, 0.11]}
        material={m.glow}
      />
      <RoundedBox
        args={[0.09, 0.28, 0.05]}
        radius={0.02}
        position={[-0.68, 1.0, 0.13]}
        material={m.glow}
      />
    </group>
  );
}
