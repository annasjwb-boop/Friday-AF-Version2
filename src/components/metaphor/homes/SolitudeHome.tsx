import { useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { useHomeMaterials } from "../materials";

/** Tall hexagonal crystal prism. */
function Crystal({
  position,
  height,
  radius,
  material,
  rotationY = 0,
}: {
  position: [number, number, number];
  height: number;
  radius: number;
  material: THREE.Material;
  rotationY?: number;
}) {
  return (
    <mesh
      position={position}
      rotation={[0, rotationY, 0]}
      material={material}
      castShadow
    >
      <cylinderGeometry args={[radius * 0.85, radius, height, 6]} />
    </mesh>
  );
}

/**
 * Fortress of Solitude: a crystalline prism cluster on a faceted plinth —
 * frosted resin, soft internal glow, no arctic scenery.
 */
export function SolitudeHome() {
  const m = useHomeMaterials();
  const crystal = useMemo(() => {
    const mat = m.glassCool.clone();
    mat.color = new THREE.Color("#e8f2f6");
    mat.emissive = new THREE.Color("#cfe8f2");
    mat.emissiveIntensity = 0.35;
    mat.transmission = 0.55;
    mat.roughness = 0.22;
    mat.thickness = 0.8;
    return mat;
  }, [m.glassCool]);

  return (
    <group>
      <RoundedBox
        args={[1.55, 0.22, 1.55]}
        radius={0.06}
        smoothness={4}
        position={[0, 0.11, 0]}
        material={m.trim}
        castShadow
        receiveShadow
      />
      <mesh position={[0, 0.24, 0]} rotation={[0, Math.PI / 4, 0]} material={m.dark}>
        <cylinderGeometry args={[0.95, 1.05, 0.06, 6]} />
      </mesh>
      <Crystal position={[0, 1.15, 0]} height={1.9} radius={0.32} material={crystal} />
      <Crystal
        position={[-0.48, 0.85, 0.2]}
        height={1.3}
        radius={0.22}
        material={crystal}
        rotationY={0.4}
      />
      <Crystal
        position={[0.42, 0.95, -0.28]}
        height={1.5}
        radius={0.2}
        material={crystal}
        rotationY={-0.5}
      />
      <Crystal
        position={[0.35, 0.68, 0.4]}
        height={0.95}
        radius={0.16}
        material={crystal}
        rotationY={0.9}
      />
      <Crystal
        position={[-0.3, 0.62, -0.42]}
        height={0.85}
        radius={0.14}
        material={crystal}
        rotationY={-0.3}
      />
      {/* Warm entry glow at the base of the tallest prism. */}
      <RoundedBox
        args={[0.22, 0.38, 0.08]}
        radius={0.03}
        position={[0, 0.48, 0.34]}
        material={m.glow}
      />
      <RoundedBox
        args={[1.2, 0.02, 0.02]}
        radius={0.006}
        position={[0, 0.03, 0.78]}
        material={m.glow}
      />
    </group>
  );
}
