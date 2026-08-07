import {
  Arch,
  BoxP,
  CLAY,
  ClayMat,
  Cloud,
  Crenels,
  Cyl,
  GlowDot,
  PLINTH_TOP,
  PebblePile,
  Plinth,
  PulseDot,
  Scaffold,
  Shard,
  StonePile,
  Tree,
} from "./shared";
import { type StateParams } from "./state";

const T = PLINTH_TOP;

/** Mooring lights running along the bridge rail toward the shore. */
const MOORINGS: [number, number, number][] = [
  [0.55, T + 0.17, 0.27],
  [0.8, T + 0.17, 0.36],
  [1.04, T + 0.17, 0.45],
];

/** A small clay boat: hull, mast, and a lantern at the masthead. */
function Boat({
  p,
  accent,
  intensity,
}: {
  p: [number, number, number];
  accent: string;
  intensity: number;
}) {
  return (
    <group position={p} rotation={[0, 0.9, 0]}>
      <mesh castShadow scale={[1.5, 0.5, 0.8]}>
        <sphereGeometry args={[0.09, 16, 12]} />
        <ClayMat color={CLAY.strut} rough={0.85} />
      </mesh>
      <Cyl p={[0, 0.12, 0]} rTop={0.006} rBot={0.008} h={0.18} color={CLAY.strut} />
      <GlowDot p={[0, 0.23, 0]} radius={0.022} color={accent} intensity={intensity} />
    </group>
  );
}

/**
 * The Island Fortress: the plinth's top step becomes a disc of water, with
 * a rocky island at its center carrying a walled round fort. A slender
 * arched bridge crosses from the plinth rim to the island gate. The fort
 * itself grows with the readiness tier: a low unfinished ring at 0, a full
 * wall with a squat tower at 1, the archetype at 2, and a turret-roofed,
 * brazier-lit stronghold at 3.
 */
export function IslandModel({ params }: { params: StateParams }) {
  const { glow, accent, wear, threat, tier, damaged } = params;
  const waterY = T + 0.012 + threat * 0.05;
  const bridgeBroken = damaged;
  const halfBuilt = tier === 0 && !damaged;
  const way = params.pathway;
  const wayLit = way !== null && way >= 0.45;
  const waterTop = waterY + 0.03;

  return (
    <group>
      <Plinth radius={1.25} topColor={CLAY.bone} />
      {/* Water fills the top of the plinth; it rises with threat */}
      <mesh position={[0, waterY, 0]} receiveShadow>
        <cylinderGeometry args={[1.22, 1.22, 0.06, 48]} />
        <meshStandardMaterial
          color={CLAY.water}
          roughness={0.25}
          metalness={0.05}
        />
      </mesh>

      {/* The island: faceted rock rising from the water */}
      <Shard p={[0, T + 0.16, 0]} r={[0, 0.4, 0]} radius={0.62} h={0.55} color={CLAY.bone} sides={7} wear={wear} />
      <Cyl p={[0, T + 0.3, 0]} rTop={0.44} rBot={0.5} h={0.14} color={CLAY.cream} wear={wear} />

      {/* Fort: ring wall, gate, and central tower — built out by tier */}
      {halfBuilt ? (
        <>
          {/* A low unfinished ring and the tower's first courses */}
          <Cyl p={[0, T + 0.4, 0]} rTop={0.41} rBot={0.42} h={0.1} color={CLAY.bone} wear={wear} />
          <Cyl p={[0, T + 0.52, 0]} rTop={0.19} rBot={0.21} h={0.16} color={CLAY.bone} wear={wear} />
          <Scaffold p={[0.3, T + 0.36, 0.22]} r={[0, -0.5, 0]} w={0.24} h={0.34} />
          <StonePile p={[-0.26, T + 0.37, 0.2]} r={[0, 0.4, 0]} />
          <GlowDot p={[0, T + 0.52, 0.2]} radius={0.024} s={[1, 1.4, 0.6]} color={accent} intensity={glow * 0.7} />
        </>
      ) : (
        <>
          <Cyl p={[0, T + 0.46, 0]} rTop={0.4} rBot={0.42} h={0.22} color={CLAY.cream} wear={wear} />
          <Crenels p={[0, T + 0.59, 0]} radius={0.38} count={11} size={[0.06, 0.06, 0.05]} />
          <BoxP p={[0, T + 0.44, 0.4]} size={[0.16, 0.18, 0.04]} color={CLAY.deep} />
          {tier >= 2 ? (
            <>
              <Cyl p={[0, T + 0.72, 0]} rTop={0.18} rBot={0.21} h={0.5} color={CLAY.cream} wear={wear} />
              {tier >= 3 ? (
                <mesh position={[0, T + 1.08, 0]} castShadow>
                  <coneGeometry args={[0.21, 0.26, 16]} />
                  <meshStandardMaterial color={CLAY.bone} roughness={0.85} />
                </mesh>
              ) : (
                <Crenels p={[0, T + 0.99, 0]} radius={0.17} count={7} size={[0.05, 0.06, 0.04]} />
              )}
              <Cyl p={[0, T + (tier >= 3 ? 1.26 : 1.04), 0]} rTop={0.02} rBot={0.02} h={0.14} color={CLAY.cream} />
              <BoxP p={[0.045, T + (tier >= 3 ? 1.31 : 1.09), 0]} size={[0.09, 0.05, 0.012]} color={accent} />
            </>
          ) : (
            /* A squat tower, its upper half not yet raised */
            <Cyl p={[0, T + 0.66, 0]} rTop={0.19} rBot={0.21} h={0.34} color={CLAY.cream} wear={wear} />
          )}
          {tier >= 3 && (
            <>
              {/* Braziers along the ring wall */}
              <GlowDot p={[0.3, T + 0.62, 0.26]} radius={0.024} color={accent} intensity={glow * 1.3} />
              <GlowDot p={[-0.3, T + 0.62, 0.26]} radius={0.024} color={accent} intensity={glow * 1.3} />
            </>
          )}
        </>
      )}

      {/* Windows */}
      {!halfBuilt && (
        <>
          {tier >= 2 && (
            <GlowDot p={[0.08, T + 0.78, 0.19]} radius={0.024} s={[1, 1.5, 0.6]} color={accent} intensity={glow} />
          )}
          <GlowDot p={[-0.09, T + 0.66, 0.18]} radius={0.024} s={[1, 1.5, 0.6]} color={accent} intensity={glow} />
          <GlowDot p={[0, T + 0.35, 0.41]} radius={0.03} s={[1, 1.4, 0.6]} color={accent} intensity={glow * 0.8} />
        </>
      )}

      {/* The bridge: arch over the water plus a slender deck */}
      <Arch p={[0.78, T - 0.02, 0.35]} r={[0, 0.42, 0]} radius={0.16} tube={0.025} />
      {bridgeBroken ? (
        <>
          {/* Deck snapped: halves tipped into the water */}
          <BoxP p={[0.52, T + 0.06, 0.26]} r={[0.15, 0.42, -0.4]} size={[0.34, 0.035, 0.14]} color={CLAY.bone} />
          <BoxP p={[1.02, T + 0.02, 0.44]} r={[-0.1, 0.42, 0.35]} size={[0.3, 0.035, 0.14]} color={CLAY.bone} />
        </>
      ) : (
        <BoxP p={[0.78, T + 0.12, 0.35]} r={[0, 0.42, 0]} size={[0.78, 0.035, 0.14]} color={CLAY.cream} />
      )}

      {/* Recovery — the way back. An island's lifeline is its boat: moored
          and lantern-lit by the bridge when the recovery plan is ready;
          capsized and half-sunk with dark moorings when it isn't. */}
      {way !== null && (
        <group userData={{ anchor: "pathway" }}>
          {MOORINGS.map((pt, i) => (
            <PulseDot
              key={i}
              p={pt}
              radius={0.022}
              color={accent}
              base={wayLit ? (1.0 + (way ?? 0) * 1.2) * (1 - i * 0.12) : 0.1}
              phase={i * 0.9}
            />
          ))}
          {wayLit ? (
            <>
              {/* A short dock off the bridge end, boat tied alongside */}
              <BoxP p={[1.06, T + 0.09, 0.55]} r={[0, 0.42, 0]} size={[0.1, 0.02, 0.2]} color={CLAY.strut} />
              <Boat
                p={[0.96, waterTop + 0.035, 0.68]}
                accent={accent}
                intensity={1.1 + (way ?? 0) * 1.3}
              />
            </>
          ) : (
            /* The only way off the island, capsized and waterlogged */
            <mesh
              position={[0.95, waterTop - 0.005, 0.68]}
              rotation={[0.12, 0.9, 0.1]}
              scale={[1.4, 0.4, 0.75]}
              castShadow
            >
              <sphereGeometry args={[0.09, 16, 12]} />
              <ClayMat color={CLAY.deep} rough={0.95} />
            </mesh>
          )}
        </group>
      )}

      {/* A tree clinging to the island edge, another on the far rim */}
      <Tree p={[-0.34, T + 0.36, -0.2]} s={0.7} />
      <Tree p={[-0.95, T - 0.02, -0.55]} s={0.8} />

      <Cloud p={[-1.25, 1.6, -0.35]} s={0.95} />
      <Cloud p={[1.25, 1.85, -0.45]} s={0.7} />

      {damaged && <PebblePile p={[0.4, T + 0.02, 0.6]} seed={4} spread={0.14} count={4} />}
    </group>
  );
}
