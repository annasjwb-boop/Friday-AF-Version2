import { RoundedBox } from "@react-three/drei";
import { useHomeMaterials } from "./materials";

/** Top surface of the shared maquette base, in world units. */
export const PLINTH_TOP = 0.26;
export const PLINTH_SIZE = 3.2;

/**
 * The shared ground plane: one satin plinth every metaphor stands on, like
 * an architectural maquette base. Keeping it identical across variations is
 * what makes the homes read as one product line.
 */
export function Plinth() {
  const m = useHomeMaterials();
  return (
    <RoundedBox
      args={[PLINTH_SIZE, PLINTH_TOP, PLINTH_SIZE]}
      radius={0.09}
      smoothness={4}
      position={[0, PLINTH_TOP / 2, 0]}
      material={m.trim}
      castShadow
      receiveShadow
    />
  );
}
