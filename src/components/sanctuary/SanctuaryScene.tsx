import { Suspense, useCallback, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { CanvasTexture, type MeshBasicMaterial } from "three";
import type { RiskState, Sanctuary } from "../../types/sanctuary";
import { stateParams } from "./models/state";
import { SceneLighting } from "./SceneLighting";
import { Atmosphere } from "./Atmosphere";
import { CameraController } from "./CameraController";
import { SanctuaryTransition } from "./SanctuaryTransition";

/**
 * Static painted ground shadow. A live contact-shadow plate re-renders the
 * scene every frame, so tree/tower/cloud shadows sweep across it as the
 * model rotates — which read as flickering smudges around the object. A
 * fixed radial blob never changes, only fading with the swap transition.
 */
function GroundShadow({
  y,
  presenceRef,
}: {
  y: number;
  presenceRef: RefObject<{ value: number }>;
}) {
  const mat = useRef<MeshBasicMaterial>(null);
  const texture = useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(10, 11, 14, 0.5)");
    g.addColorStop(0.5, "rgba(10, 11, 14, 0.24)");
    g.addColorStop(1, "rgba(10, 11, 14, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return new CanvasTexture(canvas);
  }, []);

  useFrame(() => {
    const presence = presenceRef.current;
    if (mat.current && presence) mat.current.opacity = presence.value;
  });

  return (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[4.6, 4.6]} />
      <meshBasicMaterial
        ref={mat}
        map={texture}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

/**
 * The full hero scene: transparent canvas embedded directly in the page,
 * with lighting, fog, particles, the interactive camera rig, and the
 * dissolve/reform transition around the active sanctuary model.
 */
export function SanctuaryScene({
  sanctuary,
  riskState,
  reducedMotion,
  onModelTap,
}: {
  sanctuary: Sanctuary;
  riskState: RiskState;
  reducedMotion: boolean;
  /** Extra handler for taps on the model (beyond the focus pulse). */
  onModelTap?: () => void;
}) {
  // Shared mutable channels between the transition and the lighting/pulse,
  // so per-frame animation never touches React state.
  const presenceRef = useRef({ value: 1 });
  const pulseRef = useRef({ value: 0 });
  const params = useMemo(() => stateParams(riskState), [riskState]);

  const handleTap = useCallback(() => {
    pulseRef.current.value = 1;
    onModelTap?.();
  }, [onModelTap]);

  return (
    <Canvas
      shadows
      dpr={[1.5, 2]}
      gl={{ antialias: true, alpha: true }}
      camera={{ fov: 38, position: [0, 2.3, 5.4], near: 0.1, far: 30 }}
      style={{ background: "transparent" }}
    >
      <Suspense fallback={null}>
        <SceneLighting params={params} presenceRef={presenceRef} />
        <Atmosphere params={params} reducedMotion={reducedMotion} />
        <CameraController
          sanctuary={sanctuary}
          reducedMotion={reducedMotion}
          onTap={handleTap}
        >
          <SanctuaryTransition
            targetId={sanctuary.id}
            riskState={riskState}
            presenceRef={presenceRef}
            pulseRef={pulseRef}
            reducedMotion={reducedMotion}
          />
          <GroundShadow y={sanctuary.shadowY} presenceRef={presenceRef} />
        </CameraController>
      </Suspense>
    </Canvas>
  );
}
