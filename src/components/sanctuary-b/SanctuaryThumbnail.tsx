import { useRef, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { SanctuaryId } from "../../types/sanctuary";
import { stateParams } from "./models/state";
import { SanctuaryModel } from "./SanctuaryModel";

/** Thumbnails always show the pristine archetype. */
const PRISTINE = stateParams("healthy");

function SpinGroup({ children }: { children: ReactNode }) {
  const group = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (group.current) group.current.rotation.y = clock.getElapsedTime() * 0.35;
  });
  return <group ref={group}>{children}</group>;
}

/**
 * Small live 3D preview used inside the selector. Only mounted while the
 * sheet is open, so the extra WebGL contexts are short-lived.
 */
export function SanctuaryThumbnail({ id }: { id: SanctuaryId }) {
  return (
    <Canvas
      dpr={1.5}
      gl={{ alpha: true, antialias: true }}
      camera={{ fov: 34, position: [0, 1.5, 5.1], near: 0.1, far: 20 }}
      style={{ background: "transparent", pointerEvents: "none" }}
    >
      <hemisphereLight intensity={0.95} color="#c5bdae" groundColor="#4e5058" />
      <directionalLight position={[3.2, 5.2, 3]} intensity={2.2} color="#f8f2e2" />
      <directionalLight position={[-2.8, 3, -3.5]} intensity={0.85} color="#aeb8c8" />
      <pointLight position={[0, -1.2, 1.2]} intensity={0.7} color="#9aa4b4" distance={6} />
      <SpinGroup>
        <group position={[0, -0.58, 0]} scale={0.6}>
          <SanctuaryModel id={id} params={PRISTINE} />
        </group>
      </SpinGroup>
    </Canvas>
  );
}
