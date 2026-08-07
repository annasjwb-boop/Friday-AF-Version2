import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, Quaternion, Vector3 } from "three";
import {
  BoxP,
  CLAY,
  Cloud,
  Cyl,
  GlowDot,
  PulseDot,
  Scaffold,
  Shard,
  Spire,
  StonePile,
  Strut,
  Tree,
} from "./shared";
import { type StateParams } from "./state";

type Vec3 = [number, number, number];

/** A hair-thin thread of light binding the floating fragments. */
function Thread({
  from,
  to,
  color,
  intensity,
}: {
  from: Vec3;
  to: Vec3;
  color: string;
  intensity: number;
}) {
  const { position, quaternion, length } = useMemo(() => {
    const a = new Vector3(...from);
    const b = new Vector3(...to);
    const dir = b.clone().sub(a);
    const quat = new Quaternion().setFromUnitVectors(
      new Vector3(0, 1, 0),
      dir.clone().normalize(),
    );
    return {
      position: a.clone().add(b).multiplyScalar(0.5),
      quaternion: quat,
      length: dir.length(),
    };
  }, [from, to]);
  return (
    <mesh position={position} quaternion={quaternion}>
      <capsuleGeometry args={[0.008, length, 4, 8]} />
      <meshStandardMaterial
        color="#241d14"
        emissive={color}
        emissiveIntensity={intensity}
        roughness={0.6}
      />
    </mesh>
  );
}

/** Slim art-deco tower: ribbed shaft, setback tier, needle spire. */
function DecoTower({
  p,
  w,
  h,
  lean = 0,
  accent,
  glow,
}: {
  p: Vec3;
  w: number;
  h: number;
  lean?: number;
  accent: string;
  glow: number;
}) {
  return (
    <group position={p} rotation={[0, 0, lean]}>
      <BoxP p={[0, h / 2, 0]} size={[w, h, w * 0.85]} />
      {/* Facade ribs */}
      <BoxP p={[-w * 0.28, h * 0.52, w * 0.44]} size={[w * 0.14, h * 0.9, 0.02]} color={CLAY.bone} />
      <BoxP p={[0, h * 0.55, w * 0.44]} size={[w * 0.14, h * 1.02, 0.02]} color={CLAY.bone} />
      <BoxP p={[w * 0.28, h * 0.52, w * 0.44]} size={[w * 0.14, h * 0.9, 0.02]} color={CLAY.bone} />
      {/* Setback tier and spire (tier sinks slightly into the shaft top) */}
      <BoxP p={[0, h + w * 0.52, 0]} size={[w * 0.6, w * 1.1, w * 0.55]} />
      <Spire p={[0, h + w * 1.35, 0]} h={w * 1.1} radius={w * 0.09} />
      <GlowDot p={[0.02, h * 0.62, w * 0.47]} radius={0.02} s={[1, 1.6, 0.6]} color={accent} intensity={glow} />
    </group>
  );
}

/**
 * The Sky Citadel: a faceted island floating point-down, carrying a small
 * skyline of ribbed towers — with two lesser fragments drifting alongside,
 * bound to the city by threads of light. Clouds pass beneath; a broken
 * ring of clay hangs behind like a moon.
 */
export function SkyModel({ params }: { params: StateParams }) {
  const { glow, accent, wear, threat, tier, damaged, recovering } = params;
  const drift = 1 + threat * 0.28;
  const halfBuilt = tier === 0 && !damaged;
  const upperRef = useRef<Group>(null);
  const lowerRef = useRef<Group>(null);
  const way = params.pathway;
  const wayLit = way !== null && way >= 0.45;
  // The ferry fragment: docked at the landing pad when the plan is ready,
  // drifted out of formation with a slack dark tether when it isn't.
  const ferryPos: Vec3 = wayLit ? [1.14, 1.44, 0.38] : [1.58, 1.02, 0.62];

  const smallPos: Vec3 = damaged
    ? [0.95, 0.35, 0.15]
    : recovering
      ? [0.85, 1.15, 0.02]
      : [0.9 * drift, 1.62, -0.05];
  const lowerPos: Vec3 = [-0.85 * drift, 0.62, 0.2];

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (upperRef.current && !damaged) {
      upperRef.current.position.y = Math.sin(t * 0.7) * 0.05;
    }
    if (lowerRef.current) {
      lowerRef.current.position.y = Math.sin(t * 0.9 + 2.1) * 0.04;
    }
  });

  return (
    <group>
      {/* Main island: faceted rock, point down, city on the flat top. The
          skyline itself builds out with the readiness tier. */}
      <group rotation={[0, 0, damaged ? -0.05 : 0]}>
        <Shard p={[0, 0.95, 0]} r={[Math.PI, 0.3, 0]} radius={0.78} h={0.95} color={CLAY.cream} sides={7} wear={wear} />
        <Cyl p={[0, 1.46, 0]} rTop={0.72} rBot={0.76} h={0.08} color={CLAY.cream} wear={wear} />

        {/* The skyline (bases sink into the platform so no faces sit flush) */}
        {halfBuilt ? (
          <>
            {/* First tower rising, the rest of the skyline still framed out */}
            <DecoTower p={[-0.18, 1.49, -0.1]} w={0.3} h={0.42} accent={accent} glow={glow * 0.8} />
            <Scaffold p={[0.3, 1.49, 0.16]} w={0.24} h={0.3} />
            <StonePile p={[-0.42, 1.5, 0.28]} r={[0, 0.5, 0]} />
          </>
        ) : (
          <>
            <DecoTower p={[-0.18, 1.49, -0.1]} w={0.3} h={0.75} accent={accent} glow={glow} />
            <DecoTower
              p={[0.32, 1.49, 0.18]}
              w={0.22}
              h={0.48}
              lean={damaged ? -0.3 : 0}
              accent={accent}
              glow={glow * 0.9}
            />
            {tier >= 2 && (
              <>
                <Cyl p={[-0.45, 1.65, 0.28]} rTop={0.09} rBot={0.11} h={0.32} color={CLAY.cream} wear={wear} />
                <Spire p={[-0.45, 1.9, 0.28]} h={0.18} radius={0.025} />
              </>
            )}
            {tier >= 3 && (
              <DecoTower p={[0.05, 1.49, -0.38]} w={0.18} h={0.6} accent={accent} glow={glow * 0.85} />
            )}
          </>
        )}
        <Tree p={[0.12, 1.5, 0.42]} s={0.6} />
        <Tree p={[-0.5, 1.5, -0.35]} s={0.5} />

        {/* Recovery — the way back. A floating city's lifeline is its
            connections: a landing pad juts from the rim with pulsing edge
            lights, and a small ferry fragment holds its tether. When the
            plan is weak the pad goes dark and the ferry drifts out of
            formation, its tether slack and unlit. */}
        {way !== null && (
          <group userData={{ anchor: "pathway" }}>
            <Cyl p={[0.85, 1.47, 0.3]} rTop={0.15} rBot={0.15} h={0.045} seg={6} flat color={CLAY.cream} wear={wear} />
            <Strut p={[0.72, 1.36, 0.28]} r={[0, 0, -0.85]} length={0.28} radius={0.012} />
            {[0.4, 2.4, 4.4].map((a, i) => (
              <PulseDot
                key={i}
                p={[0.85 + 0.12 * Math.sin(a), 1.5, 0.3 + 0.12 * Math.cos(a)]}
                radius={0.018}
                color={accent}
                base={wayLit ? 1.1 + (way ?? 0) * 1.2 : 0.1}
                phase={i * 0.7}
              />
            ))}
            <group position={ferryPos} rotation={wayLit ? [0, 0.6, 0] : [0.35, 0.4, 0.25]}>
              <Shard p={[0, 0, 0]} r={[Math.PI, 0, 0]} radius={0.11} h={0.16} color={CLAY.cream} sides={6} />
              <GlowDot
                p={[0, 0.09, 0]}
                radius={0.02}
                color={accent}
                intensity={wayLit ? 1.2 + (way ?? 0) * 1.2 : 0.08}
              />
            </group>
            <Thread
              from={[0.97, 1.46, 0.33]}
              to={[ferryPos[0] - 0.06, ferryPos[1] + 0.02, ferryPos[2]]}
              color={accent}
              intensity={wayLit ? glow * 1.6 : 0.06}
            />
          </group>
        )}
      </group>

      {/* Lesser fragment: falls when the citadel is damaged */}
      <group ref={upperRef}>
        <group position={smallPos} rotation={damaged ? [0.7, 0.2, 0.5] : [0, 0.5, 0]}>
          <Shard p={[0, 0, 0]} r={[Math.PI, 0, 0]} radius={0.26} h={0.34} color={CLAY.cream} sides={6} />
          <Cyl p={[0, 0.3, 0]} rTop={0.07} rBot={0.085} h={0.28} color={CLAY.cream} />
          <Spire p={[0, 0.5, 0]} h={0.14} radius={0.02} />
        </group>
      </group>

      {/* Smallest fragment with a lone tree */}
      <group ref={lowerRef}>
        <group position={lowerPos} rotation={[0, 1.2, 0]}>
          <Shard p={[0, 0, 0]} r={[Math.PI, 0, 0]} radius={0.17} h={0.24} color={CLAY.cream} sides={6} />
          <Tree p={[0, 0.1, 0]} s={0.5} />
        </group>
      </group>

      {/* Threads of light */}
      {!damaged && (
        <Thread
          from={[0.55, 1.35, 0]}
          to={[smallPos[0] - 0.1, smallPos[1] - 0.08, smallPos[2]]}
          color={accent}
          intensity={glow * (recovering ? 2.6 : 1.5)}
        />
      )}
      <Thread
        from={[-0.55, 0.95, 0.1]}
        to={[lowerPos[0] + 0.08, lowerPos[1] + 0.06, lowerPos[2]]}
        color={accent}
        intensity={glow * 1.2}
      />

      {/* Clouds passing beneath and beside */}
      <Cloud p={[0.55, 0.35, 0.35]} s={1} />
      <Cloud p={[-1.2, 1.5, -0.3]} s={0.85} />
      <Cloud p={[1.25, 2.1, -0.5]} s={0.7} />
    </group>
  );
}
