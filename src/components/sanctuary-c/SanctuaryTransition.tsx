import { useMemo, useRef, useState, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { BufferGeometry, Group, Points, PointsMaterial } from "three";
import type { SanctuaryId } from "../../types/sanctuary";
import type { StateParams } from "./models/state";
import { SanctuaryModel } from "./SanctuaryModel";

const OUT_DURATION = 0.38;
const IN_DURATION = 0.5;

function smooth(t: number) {
  return t * t * (3 - 2 * t);
}

/** One-shot burst of cream dust released when a base dissolves or reforms. */
function DissolveDust() {
  const points = useRef<Points>(null);
  const life = useRef(0);
  const { positions, velocities } = useMemo(() => {
    const count = 60;
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.3 + Math.random() * 1.1;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = Math.random() * 0.35;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
      vel[i * 3] = Math.cos(angle) * (0.2 + Math.random() * 0.4);
      vel[i * 3 + 1] = 0.5 + Math.random() * 0.9;
      vel[i * 3 + 2] = Math.sin(angle) * (0.2 + Math.random() * 0.4);
    }
    return { positions: pos, velocities: vel };
  }, []);

  useFrame((_, dt) => {
    life.current += dt;
    const p = points.current;
    if (!p) return;
    const t = Math.min(1, life.current / 1.1);
    const geo = p.geometry as BufferGeometry;
    const attr = geo.attributes.position;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < arr.length / 3; i++) {
      arr[i * 3] += velocities[i * 3] * dt;
      arr[i * 3 + 1] += velocities[i * 3 + 1] * dt;
      arr[i * 3 + 2] += velocities[i * 3 + 2] * dt;
    }
    attr.needsUpdate = true;
    (p.material as PointsMaterial).opacity = 0.75 * (1 - smooth(t));
    p.visible = t < 1;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#e6e6e9"
        size={0.045}
        transparent
        opacity={0.75}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

/**
 * Owns the dissolve-and-reform choreography. When `sceneKey` changes (a new
 * sanctuary, or the switch between the pristine showroom and the
 * personalized risk view), the current sanctuary rotates away, sinks and
 * collapses while the lighting dims (via the shared `presenceRef`), dust
 * lifts off the base, and the new sanctuary rises into place. Live param
 * tweaks under the same key (the demo sliders) update in place without a
 * dissolve. Also carries the idle breathing motion and the tap-focus pulse.
 */
export function SanctuaryTransition({
  sceneKey,
  targetId,
  params,
  presenceRef,
  pulseRef,
  reducedMotion,
}: {
  sceneKey: string;
  targetId: SanctuaryId;
  params: StateParams;
  presenceRef: RefObject<{ value: number }>;
  pulseRef: RefObject<{ value: number }>;
  reducedMotion: boolean;
}) {
  const [display, setDisplay] = useState({ key: sceneKey, id: targetId, params });
  const [burst, setBurst] = useState(0);
  const outer = useRef<Group>(null);
  const inner = useRef<Group>(null);
  const swapping = useRef(false);

  // Same key, new params (demo sliders): adopt immediately, no dissolve.
  if (display.key === sceneKey && display.params !== params) {
    setDisplay({ key: sceneKey, id: targetId, params });
  }

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const presence = presenceRef.current;
    if (!presence) return;

    if (sceneKey !== display.key) {
      // Dissolve.
      const speed = reducedMotion ? 4 : 1 / OUT_DURATION;
      presence.value = Math.max(0, presence.value - dt * speed);
      if (presence.value === 0 && !swapping.current) {
        swapping.current = true;
        setDisplay({ key: sceneKey, id: targetId, params });
        if (!reducedMotion) setBurst((b) => b + 1);
      }
    } else {
      swapping.current = false;
      // Reform.
      const speed = reducedMotion ? 4 : 1 / IN_DURATION;
      presence.value = Math.min(1, presence.value + dt * speed);
    }

    const e = smooth(presence.value);
    const g = outer.current;
    if (g) {
      g.scale.set(
        0.62 + 0.38 * e,
        Math.max(0.001, Math.pow(e, 1.35)),
        0.62 + 0.38 * e,
      );
      g.position.y = (1 - e) * -0.75;
      // The departing object subtly rotates away; the arriving one unwinds.
      g.rotation.y = (1 - e) * 0.55;
    }

    // Breathing + tap-focus pulse on the inner group.
    const pulse = pulseRef.current;
    if (inner.current && pulse) {
      const t = state.clock.getElapsedTime();
      const breathe = reducedMotion ? 0 : Math.sin(t * 0.5) * 0.012;
      let pulseScale = 0;
      if (pulse.value > 0) {
        pulseScale = Math.sin((1 - pulse.value) * Math.PI) * 0.028;
        pulse.value = Math.max(0, pulse.value - dt / 0.45);
      }
      const scale = 1 + pulseScale;
      inner.current.scale.set(scale, scale, scale);
      inner.current.position.y = breathe;
    }
  });

  return (
    <group ref={outer}>
      <group ref={inner}>
        <SanctuaryModel id={display.id} params={display.params} />
      </group>
      {burst > 0 && <DissolveDust key={burst} />}
    </group>
  );
}
