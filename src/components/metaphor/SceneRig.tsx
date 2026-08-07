import { useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { Bloom, EffectComposer, N8AO } from "@react-three/postprocessing";
import type { FogExp2 } from "three";
import { useSmoothedHomeState } from "./state";
import { GroundShadow } from "./GroundShadow";
import { Plinth, PLINTH_TOP } from "./Plinth";
import { StateDressing } from "./StateDressing";
import { STAGE_BACKGROUND } from "./types";

/** Orbit pivot, roughly the maquette's visual center of mass. */
const TARGET: [number, number, number] = [0, 0.9, 0];

/** Environmental haze: active risk gently thickens the studio air. */
function HazeRig() {
  const fog = useRef<FogExp2>(null);
  const smoothed = useSmoothedHomeState();

  useFrame(() => {
    if (!fog.current) return;
    fog.current.density = 0.004 + smoothed.current.activeRisk * 0.022;
  });

  return <fogExp2 ref={fog} attach="fog" args={[STAGE_BACKGROUND, 0.004]} />;
}

/**
 * Shared studio rig: soft key + fill, Lightformer environment, AO, selective
 * bloom, and free orbit (rotate / zoom / pan) so the maquette is fully
 * dimensional.
 */
export function SceneRig({ children }: { children: ReactNode }) {
  return (
    <>
      <HazeRig />

      <ambientLight intensity={0.55} color="#fff7ec" />
      <directionalLight
        position={[-4.5, 7, 5.5]}
        intensity={1.45}
        color="#fff3e2"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
        shadow-normalBias={0.03}
        shadow-camera-left={-3.2}
        shadow-camera-right={3.2}
        shadow-camera-top={3.2}
        shadow-camera-bottom={-3.2}
        shadow-camera-near={1}
        shadow-camera-far={22}
      />
      <directionalLight position={[5, 3.5, -3]} intensity={0.45} color="#edf1f6" />

      <Environment resolution={256}>
        <Lightformer
          intensity={1.2}
          position={[-5, 6, 6]}
          rotation-y={Math.PI / 5}
          scale={[9, 6, 1]}
          color="#fff6e8"
        />
        <Lightformer
          intensity={0.7}
          position={[6, 4, -4]}
          rotation-y={-Math.PI / 2.5}
          scale={[7, 5, 1]}
          color="#eef2f8"
        />
        <Lightformer
          intensity={0.85}
          position={[0, 8, 0]}
          rotation-x={-Math.PI / 2}
          scale={[11, 11, 1]}
          color="#fffdf8"
        />
      </Environment>

      <GroundShadow />
      <Plinth />
      <group position={[0, PLINTH_TOP, 0]}>{children}</group>
      <StateDressing />

      <OrbitControls
        makeDefault
        target={TARGET}
        enablePan
        enableZoom
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.85}
        panSpeed={0.55}
        zoomSpeed={0.65}
        minDistance={3.2}
        maxDistance={14}
        minPolarAngle={0.25}
        maxPolarAngle={Math.PI / 2 + 0.05}
      />

      <EffectComposer multisampling={4}>
        <N8AO
          quality="medium"
          aoRadius={0.45}
          intensity={2.2}
          distanceFalloff={0.9}
          color="#2c2721"
        />
        <Bloom
          mipmapBlur
          intensity={0.38}
          luminanceThreshold={1.05}
          luminanceSmoothing={0.25}
        />
      </EffectComposer>
    </>
  );
}
