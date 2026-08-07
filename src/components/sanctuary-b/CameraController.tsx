import { useEffect, useRef, type ReactNode } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { Group } from "three";
import type { Sanctuary } from "../../types/sanctuary";

const TARGET_Y = 0.78;
const BASE_ELEVATION = 0.3;
const PITCH_MIN = -0.1;
const PITCH_MAX = 0.28;
const ZOOM_MIN = 0.85;
const ZOOM_MAX = 1.35;
const IDLE_ROTATE_AFTER = 4; // seconds
const IDLE_RESET_AFTER = 9;

function damp(current: number, target: number, k: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-k * dt));
}

/** Shortest angular distance so the settle never spins the long way round. */
function yawDelta(from: number, to: number) {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** A composed viewpoint the rig eases toward (guided story scenes). */
export type CameraFocus = { yaw: number; pitch: number; zoom: number };

/**
 * Presentation-safe camera rig. Horizontal drag spins the sanctuary (the
 * model group rotates, so the fixed key light sweeps across it), vertical
 * drag tilts within a narrow band, pinch/scroll zooms within safe limits,
 * momentum carries after release, idle time brings a slow rotation and then
 * a composed reset. Pointer position adds a small parallax. When `focus`
 * is set, the rig eases toward that viewpoint instead of idling — drags
 * still work, and release pulls the camera back to the focus.
 */
export function CameraController({
  sanctuary,
  reducedMotion,
  focus = null,
  onTap,
  children,
}: {
  sanctuary: Sanctuary;
  reducedMotion: boolean;
  focus?: CameraFocus | null;
  onTap: () => void;
  children: ReactNode;
}) {
  const group = useRef<Group>(null);
  const { camera, gl } = useThree();
  const focusRef = useRef<CameraFocus | null>(focus);
  focusRef.current = focus;

  const st = useRef({
    yaw: sanctuary.heroYaw,
    vel: 0,
    pitch: 0.06,
    pitchTarget: 0.06,
    zoom: 1,
    zoomTarget: 1,
    parX: 0,
    parY: 0,
    parXT: 0,
    parYT: 0,
    dragging: false,
    pinching: false,
    lastInteract: -1e9,
    settleYaw: null as number | null,
  });

  // Ease to the composed hero angle whenever the sanctuary changes.
  useEffect(() => {
    const s = st.current;
    s.settleYaw = sanctuary.heroYaw;
    s.pitchTarget = 0.06;
    s.zoomTarget = 1;
    s.vel = 0;
  }, [sanctuary.id, sanctuary.heroYaw]);

  useEffect(() => {
    const el = gl.domElement;
    el.style.touchAction = "none";
    el.style.cursor = "grab";

    const s = st.current;
    const pointers = new Map<number, { x: number; y: number }>();
    let downX = 0;
    let downY = 0;
    let downTime = 0;
    let moved = 0;
    let pinchStartDist = 0;
    let pinchStartZoom = 1;

    const markInteract = () => {
      s.lastInteract = performance.now() / 1000;
      s.settleYaw = null;
    };

    const onPointerDown = (e: PointerEvent) => {
      el.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      markInteract();
      if (pointers.size === 1) {
        s.dragging = true;
        s.vel = 0;
        downX = e.clientX;
        downY = e.clientY;
        downTime = performance.now();
        moved = 0;
        el.style.cursor = "grabbing";
      } else if (pointers.size === 2) {
        s.pinching = true;
        s.dragging = false;
        const [a, b] = [...pointers.values()];
        pinchStartDist = Math.hypot(a.x - b.x, a.y - b.y);
        pinchStartZoom = s.zoomTarget;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      // Parallax follows the pointer even without a drag.
      const rect = el.getBoundingClientRect();
      s.parXT = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      s.parYT = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

      const prev = pointers.get(e.pointerId);
      if (!prev) return;
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      markInteract();

      if (s.pinching && pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist > 0 && pinchStartDist > 0) {
          s.zoomTarget = Math.min(
            ZOOM_MAX,
            Math.max(ZOOM_MIN, (pinchStartZoom * pinchStartDist) / dist),
          );
        }
        return;
      }

      if (s.dragging) {
        moved += Math.abs(dx) + Math.abs(dy);
        s.yaw += dx * 0.007;
        s.vel = dx * 0.007 * 60;
        s.pitchTarget = Math.min(
          PITCH_MAX,
          Math.max(PITCH_MIN, s.pitchTarget - dy * 0.0035),
        );
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      const wasTap =
        s.dragging &&
        moved < 8 &&
        performance.now() - downTime < 350 &&
        Math.abs(e.clientX - downX) < 8 &&
        Math.abs(e.clientY - downY) < 8;
      if (pointers.size === 0) {
        s.dragging = false;
        s.pinching = false;
        el.style.cursor = "grab";
      } else if (pointers.size === 1) {
        s.pinching = false;
      }
      markInteract();
      if (wasTap) onTap();
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      markInteract();
      s.zoomTarget = Math.min(
        ZOOM_MAX,
        Math.max(ZOOM_MIN, s.zoomTarget + e.deltaY * 0.0012),
      );
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
      el.removeEventListener("wheel", onWheel);
    };
  }, [gl, onTap]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const s = st.current;
    const now = performance.now() / 1000;
    const idle = now - s.lastInteract;

    const focusTarget = focusRef.current;

    if (!s.dragging) {
      // Momentum, then a gentle decay to rest.
      s.yaw += s.vel * dt;
      s.vel *= Math.exp(-2.8 * dt);

      if (focusTarget) {
        // Guided scene: ease every axis toward the composed viewpoint.
        s.settleYaw = null;
        s.yaw += yawDelta(s.yaw, focusTarget.yaw) * (1 - Math.exp(-2.4 * dt));
        s.pitchTarget = damp(s.pitchTarget, focusTarget.pitch, 3, dt);
        s.zoomTarget = damp(s.zoomTarget, focusTarget.zoom, 3, dt);
      } else if (s.settleYaw !== null) {
        // Settling into the composed angle for a newly chosen sanctuary.
        const d = yawDelta(s.yaw, s.settleYaw);
        s.yaw += d * (1 - Math.exp(-3 * dt));
        if (Math.abs(d) < 0.005) s.settleYaw = null;
      } else if (!reducedMotion && idle > IDLE_ROTATE_AFTER) {
        const ramp = Math.min(1, (idle - IDLE_ROTATE_AFTER) / 3);
        s.yaw += 0.055 * ramp * dt;
      }

      if (!focusTarget && idle > IDLE_RESET_AFTER) {
        // Composed reset: tilt and zoom drift home, the slow spin continues.
        s.pitchTarget = damp(s.pitchTarget, 0.06, 0.8, dt);
        s.zoomTarget = damp(s.zoomTarget, 1, 0.8, dt);
      }
    }

    s.pitch = damp(s.pitch, s.pitchTarget, 8, dt);
    s.zoom = damp(s.zoom, s.zoomTarget, 6, dt);
    s.parX = damp(s.parX, reducedMotion ? 0 : s.parXT, 2.5, dt);
    s.parY = damp(s.parY, reducedMotion ? 0 : s.parYT, 2.5, dt);

    if (group.current) group.current.rotation.y = s.yaw;

    const dist = 5.7 * sanctuary.framing * s.zoom;
    const elev = BASE_ELEVATION + s.pitch;
    camera.position.set(
      s.parX * 0.28,
      TARGET_Y + Math.sin(elev) * dist + s.parY * -0.18,
      Math.cos(elev) * dist,
    );
    camera.lookAt(0, TARGET_Y, 0);
  });

  return <group ref={group}>{children}</group>;
}
