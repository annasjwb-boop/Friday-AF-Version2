import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import "./ProductOrbit.css";

export type ProductOrbitProps = {
  /** Turntable frames in clockwise order starting at the hero angle. */
  frames: string[];
  alt: string;
  className?: string;
  /** Clamp zoom so the full render always fits inside the viewport. */
  contain?: boolean;
  /** Fires once the turntable textures are loaded and rendering. */
  onReady?: () => void;
};

type Pose = { yaw: number; tilt: number; zoom: number };

/**
 * Product 360° viewer for the studio beauty renders.
 * Drag spins through real product photographs; scroll zooms; vertical drag tilts.
 */
export function ProductOrbit({
  frames,
  alt,
  className,
  contain = false,
  onReady,
}: ProductOrbitProps) {
  const [pose, setPose] = useState<Pose>({ yaw: 0, tilt: 0, zoom: 1 });
  const [contextGeneration, setContextGeneration] = useState(0);

  if (frames.length === 0) return null;

  return (
    <div
      className={`product-orbit${className ? ` ${className}` : ""}`}
      role="img"
      aria-label={`${alt}. Drag to rotate, scroll to zoom.`}
    >
      <Canvas
        key={contextGeneration}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.NoToneMapping }}
        /* Contain mode centers the camera so the render projects exactly
           like a static <img object-fit: contain> — swaps stay seamless. */
        camera={{
          fov: 28,
          position: [0, contain ? 0 : 0.08, 4.0],
          near: 0.1,
          far: 40,
        }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener(
            "webglcontextlost",
            (event) => {
              event.preventDefault();
              setTimeout(() => setContextGeneration((n) => n + 1), 400);
            },
            { once: true },
          );
        }}
      >
        <Suspense fallback={null}>
          <DragControls pose={pose} setPose={setPose} />
          <BeautyFrame
            frames={frames}
            pose={pose}
            contain={contain}
            onReady={onReady}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

function DragControls({
  pose,
  setPose,
}: {
  pose: Pose;
  setPose: (pose: Pose | ((p: Pose) => Pose)) => void;
}) {
  const gl = useThree((s) => s.gl);
  const poseRef = useRef(pose);
  poseRef.current = pose;

  useEffect(() => {
    const el = gl.domElement;
    const drag = {
      active: false,
      x: 0,
      y: 0,
      yaw: 0,
      tilt: 0,
    };

    const onDown = (event: PointerEvent) => {
      drag.active = true;
      drag.x = event.clientX;
      drag.y = event.clientY;
      drag.yaw = poseRef.current.yaw;
      drag.tilt = poseRef.current.tilt;
      el.setPointerCapture(event.pointerId);
    };

    const onMove = (event: PointerEvent) => {
      if (!drag.active) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      const nextYaw = drag.yaw + dx / 260;
      setPose({
        yaw: ((nextYaw % 1) + 1) % 1,
        tilt: Math.max(-1, Math.min(1, drag.tilt - dy / 160)),
        zoom: poseRef.current.zoom,
      });
    };

    const onUp = (event: PointerEvent) => {
      drag.active = false;
      try {
        el.releasePointerCapture(event.pointerId);
      } catch {
        /* already released */
      }
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setPose((p) => ({
        ...p,
        zoom: Math.max(0.85, Math.min(1.6, p.zoom - event.deltaY * 0.0012)),
      }));
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("wheel", onWheel);
    };
  }, [gl, setPose]);

  return null;
}

function BeautyFrame({
  frames,
  pose,
  contain,
  onReady,
}: {
  frames: string[];
  pose: Pose;
  contain: boolean;
  onReady?: () => void;
}) {
  const group = useRef<THREE.Group>(null);
  const textures = useTexture(frames);
  const maps = useMemo(() => {
    const list = (Array.isArray(textures) ? textures : [textures]).slice();
    for (const t of list) {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
    }
    return list;
  }, [textures]);

  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: maps[0],
        transparent: true,
        toneMapped: false,
        depthWrite: false,
      }),
    [maps],
  );

  useEffect(() => () => mat.dispose(), [mat]);

  /* This component only renders once useTexture resolves, so mount ==
     textures ready. Defer a frame so the first draw has happened. */
  useEffect(() => {
    if (!onReady) return;
    const id = requestAnimationFrame(() => onReady());
    return () => cancelAnimationFrame(id);
  }, [onReady]);

  const target = useRef(pose);
  target.current = pose;
  const settled = useRef(false);

  useFrame(({ viewport }, delta) => {
    if (!group.current) return;
    const t = target.current;
    /* In contain mode the render may never outgrow the frustum — the 0.96
       margin absorbs the perspective bulge when the plane tilts. */
    const maxScale = contain
      ? Math.min(viewport.width / width, viewport.height / height) * 0.96
      : Infinity;
    const goal = Math.min(t.zoom, maxScale);
    /* Snap to the fitted scale on the first frame — damping from the
       default scale reads as a pop when the orbit mounts. */
    if (!settled.current) {
      group.current.scale.setScalar(goal);
      settled.current = true;
    }
    const z = THREE.MathUtils.damp(group.current.scale.x, goal, 8, delta);
    group.current.scale.setScalar(z);
    group.current.rotation.x = THREE.MathUtils.damp(
      group.current.rotation.x,
      t.tilt * 0.2,
      10,
      delta,
    );

    const idx = Math.floor(t.yaw * maps.length) % maps.length;
    if (mat.map !== maps[idx]) {
      mat.map = maps[idx];
      mat.needsUpdate = true;
    }
  });

  const image = maps[0].image as { width: number; height: number };
  const width = 3.25;
  const height = width * (image.height / image.width);

  return (
    <group ref={group}>
      <mesh material={mat}>
        <planeGeometry args={[width, height]} />
      </mesh>
    </group>
  );
}
