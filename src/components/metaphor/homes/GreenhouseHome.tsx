import { RoundedBox } from "@react-three/drei";
import { useHomeMaterials } from "../materials";
import { Entry } from "../parts";

const ROOF_ANGLE = 0.62;

/**
 * Greenhouse: a lightweight framed structure with translucent tinted roof
 * panels, simplified soft greenery inside, and a solid protective
 * foundation.
 */
export function GreenhouseHome() {
  const m = useHomeMaterials();
  return (
    <group>
      {/* Solid protective foundation. */}
      <RoundedBox
        args={[1.72, 0.34, 1.24]}
        radius={0.07}
        smoothness={5}
        position={[0, 0.17, 0]}
        material={m.trim}
        castShadow
        receiveShadow
      />
      {/* Corner posts and ridge beam. */}
      {([
        [-0.76, 0.52],
        [0.76, 0.52],
        [-0.76, -0.52],
        [0.76, -0.52],
      ] as const).map(([x, z]) => (
        <RoundedBox
          key={`${x}${z}`}
          args={[0.07, 0.62, 0.07]}
          radius={0.02}
          position={[x, 0.65, z]}
          material={m.dark}
          castShadow
        />
      ))}
      <RoundedBox
        args={[1.66, 0.07, 0.08]}
        radius={0.025}
        position={[0, 1.36, 0]}
        material={m.dark}
        castShadow
      />
      {/* Translucent side walls. */}
      <RoundedBox
        args={[1.56, 0.6, 0.05]}
        radius={0.02}
        position={[0, 0.64, 0.52]}
        material={m.glassCool}
      />
      <RoundedBox
        args={[1.56, 0.6, 0.05]}
        radius={0.02}
        position={[0, 0.64, -0.52]}
        material={m.glassCool}
      />
      <RoundedBox
        args={[0.05, 0.6, 1.0]}
        radius={0.02}
        position={[0.76, 0.64, 0]}
        material={m.glassCool}
      />
      {/* Tinted gable roof panes with visible thickness. */}
      <RoundedBox
        args={[1.7, 0.055, 0.78]}
        radius={0.02}
        position={[0, 1.13, 0.33]}
        rotation={[ROOF_ANGLE, 0, 0]}
        material={m.glassCool}
        castShadow
      />
      <RoundedBox
        args={[1.7, 0.055, 0.78]}
        radius={0.02}
        position={[0, 1.13, -0.33]}
        rotation={[-ROOF_ANGLE, 0, 0]}
        material={m.glassCool}
        castShadow
      />
      {/* Simplified soft greenery, diffused behind the glazing. */}
      <mesh position={[-0.42, 0.62, 0.08]} material={m.plant} castShadow>
        <sphereGeometry args={[0.24, 32, 24]} />
      </mesh>
      <mesh position={[0.06, 0.72, -0.16]} material={m.plant} castShadow>
        <capsuleGeometry args={[0.16, 0.3, 8, 24]} />
      </mesh>
      <mesh position={[0.44, 0.58, 0.14]} material={m.plant} castShadow>
        <sphereGeometry args={[0.18, 32, 24]} />
      </mesh>
      {/* Solid entry vestibule on the left end. */}
      <RoundedBox
        args={[0.42, 0.66, 0.7]}
        radius={0.06}
        smoothness={5}
        position={[-0.98, 0.65, 0]}
        material={m.shell}
        castShadow
        receiveShadow
      />
      <Entry position={[-0.98, 0.4, 0.34]} width={0.24} height={0.44} />
    </group>
  );
}
