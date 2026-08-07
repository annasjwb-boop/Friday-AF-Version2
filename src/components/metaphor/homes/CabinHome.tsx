import { useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { useHomeMaterials } from "../materials";
import { Entry, Window } from "../parts";

/** Beveled gable prism for the roof and the glazed front pediment. */
function useGableGeometry(width: number, height: number, depth: number) {
  return useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, 0);
    shape.lineTo(width / 2, 0);
    shape.lineTo(0, height);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 3,
    });
    geometry.center();
    return geometry;
  }, [width, height, depth]);
}

/**
 * Cabin: a compact pitched-roof structure — pale wood body, warm glazed
 * gable, dark roof planes, and a solid stone-like base.
 */
export function CabinHome() {
  const m = useHomeMaterials();
  const roof = useGableGeometry(1.72, 0.62, 1.18);
  const gableGlass = useGableGeometry(1.1, 0.42, 0.05);

  return (
    <group>
      {/* Stone-like base course. */}
      <RoundedBox
        args={[1.56, 0.3, 1.2]}
        radius={0.06}
        smoothness={5}
        position={[0, 0.15, 0]}
        material={m.stone}
        castShadow
        receiveShadow
      />
      {/* Wood body. */}
      <RoundedBox
        args={[1.44, 0.62, 1.08]}
        radius={0.05}
        smoothness={5}
        position={[0, 0.59, 0]}
        material={m.wood}
        castShadow
        receiveShadow
      />
      {/* Pitched roof, ridge running front-to-back. */}
      <mesh
        geometry={roof}
        position={[0, 1.18, 0]}
        rotation={[0, Math.PI / 2, 0]}
        material={m.dark}
        castShadow
      />
      {/* Warm glazed pediment under the front gable. */}
      <mesh
        geometry={gableGlass}
        position={[0, 1.08, 0.56]}
        material={m.glassWarm}
      />
      <Entry position={[-0.36, 0.42, 0.52]} width={0.3} height={0.5} />
      <Window position={[0.34, 0.56, 0.52]} width={0.36} height={0.3} />
      <Window
        position={[0.7, 0.56, -0.1]}
        rotation={[0, Math.PI / 2, 0]}
        width={0.3}
        height={0.28}
      />
      {/* Chimney. */}
      <RoundedBox
        args={[0.2, 0.5, 0.2]}
        radius={0.04}
        smoothness={4}
        position={[0.5, 1.42, -0.3]}
        material={m.trim}
        castShadow
      />
    </group>
  );
}
