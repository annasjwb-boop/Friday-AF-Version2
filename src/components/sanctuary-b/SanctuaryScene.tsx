import { Suspense, useCallback, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  CanvasTexture,
  type Color,
  type Group,
  type Material,
  type Mesh,
  type MeshBasicMaterial,
  type MeshStandardMaterial,
  type Object3D,
} from "three";
import type { Sanctuary } from "../../types/sanctuary";
import type { StateParams } from "./models/state";
import { getSanctuaryTheme, type SanctuaryTheme } from "./themes";
import { SceneLighting } from "./SceneLighting";
import { Atmosphere } from "./Atmosphere";
import { CameraController, type CameraFocus } from "./CameraController";
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

/** Walk up the parents to find the nearest tagged anchor group. */
function resolveAnchor(obj: Object3D): string | null {
  const cached = obj.userData.__anchor;
  if (cached !== undefined) return cached;
  let node: Object3D | null = obj;
  let anchor: string | null = null;
  while (node) {
    if (typeof node.userData.anchor === "string") {
      anchor = node.userData.anchor;
      break;
    }
    node = node.parent;
  }
  obj.userData.__anchor = anchor;
  return anchor;
}

interface MaterialSnapshot {
  color: Color;
  emissiveIntensity: number | null;
}

/**
 * When a "Why it looks this way" row is selected, its scene region stays
 * bright while every other anchored region dims and desaturates. Runs
 * per-frame on mutable material state — no React re-renders while easing.
 */
function HighlightController({
  rootRef,
  anchor,
}: {
  rootRef: RefObject<Group | null>;
  anchor: string | null;
}) {
  const anchorRef = useRef<string | null>(anchor);
  anchorRef.current = anchor;
  const strength = useRef(0);
  const dirty = useRef(false);
  const snapshots = useRef(new WeakMap<Material, MaterialSnapshot>());

  useFrame((_, dt) => {
    const root = rootRef.current;
    if (!root) return;
    const active = anchorRef.current;
    const target = active ? 1 : 0;
    strength.current += (target - strength.current) * (1 - Math.exp(-7 * dt));
    const s = strength.current;

    // Idle: do nothing (so the scene's own pulse animations run freely),
    // beyond one restoring pass after a highlight fully fades out.
    const idle = !active && s < 0.01;
    if (idle && !dirty.current) return;
    if (idle) {
      strength.current = 0;
      dirty.current = false;
    } else {
      dirty.current = true;
    }

    root.traverse((obj) => {
      const mesh = obj as Mesh;
      if (!mesh.isMesh || Array.isArray(mesh.material)) return;
      const meshAnchor = resolveAnchor(obj);
      if (meshAnchor === null) return;
      const material = mesh.material as MeshStandardMaterial;
      // Shader materials (dome, particles) have no color to dim.
      if (!material.color) return;
      let snap = snapshots.current.get(material);
      if (!snap) {
        snap = {
          color: material.color.clone(),
          emissiveIntensity:
            typeof material.emissiveIntensity === "number"
              ? material.emissiveIntensity
              : null,
        };
        snapshots.current.set(material, snap);
      }
      const selected = active !== null && meshAnchor === active;
      const dim = idle ? 1 : selected ? 1 : 1 - 0.72 * s;
      material.color.copy(snap.color).multiplyScalar(dim);
      if (snap.emissiveIntensity !== null) {
        material.emissiveIntensity = idle
          ? snap.emissiveIntensity
          : selected
            ? snap.emissiveIntensity * (1 + 0.5 * s)
            : snap.emissiveIntensity * (1 - 0.85 * s);
      }
    });
  });

  return null;
}

/**
 * The full hero scene: transparent canvas embedded directly in the page,
 * with lighting, fog, particles, the interactive camera rig, and the
 * dissolve/reform transition around the active sanctuary model.
 */
export function SanctuaryScene({
  sanctuary,
  params,
  theme = getSanctuaryTheme("dusk"),
  sceneKey,
  highlightAnchor = null,
  cameraFocus = null,
  reducedMotion,
  onModelTap,
}: {
  sanctuary: Sanctuary;
  params: StateParams;
  /** Environment theme driving lighting and fog. */
  theme?: SanctuaryTheme;
  /** Changing this key runs the dissolve/reform transition. */
  sceneKey: string;
  /** Scene region to spotlight while the "why" sheet is open. */
  highlightAnchor?: string | null;
  /** Composed viewpoint for guided story scenes. */
  cameraFocus?: CameraFocus | null;
  reducedMotion: boolean;
  /** Extra handler for taps on the model (beyond the focus pulse). */
  onModelTap?: () => void;
}) {
  // Shared mutable channels between the transition and the lighting/pulse,
  // so per-frame animation never touches React state.
  const presenceRef = useRef({ value: 1 });
  const pulseRef = useRef({ value: 0 });
  const modelRootRef = useRef<Group>(null);

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
      // Measure layout size, not the transformed rect — the story overlay
      // mounts this scene inside a CSS-scaled stage during its expansion.
      resize={{ offsetSize: true }}
      style={{ background: "transparent" }}
    >
      <Suspense fallback={null}>
        <SceneLighting params={params} theme={theme} presenceRef={presenceRef} />
        <Atmosphere params={params} theme={theme} reducedMotion={reducedMotion} />
        <CameraController
          sanctuary={sanctuary}
          reducedMotion={reducedMotion}
          focus={cameraFocus}
          onTap={handleTap}
        >
          <group ref={modelRootRef}>
            <SanctuaryTransition
              sceneKey={sceneKey}
              targetId={sanctuary.id}
              params={params}
              presenceRef={presenceRef}
              pulseRef={pulseRef}
              reducedMotion={reducedMotion}
            />
          </group>
          <GroundShadow y={sanctuary.shadowY} presenceRef={presenceRef} />
        </CameraController>
        <HighlightController rootRef={modelRootRef} anchor={highlightAnchor} />
      </Suspense>
    </Canvas>
  );
}
