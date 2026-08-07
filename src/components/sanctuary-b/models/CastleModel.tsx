import {
  Arch,
  BoxP,
  CLAY,
  Cloud,
  Crenels,
  Cyl,
  GlowDot,
  PLINTH_TOP,
  PebblePile,
  Pine,
  Plinth,
  RoadSlab,
  Scaffold,
  Spire,
  Stairs,
  StonePile,
  Tree,
} from "./shared";
import { type StateParams } from "./state";

const T = PLINTH_TOP;

/** The road home: paving stones descending the plinth steps from the gate. */
const ROAD: [number, number, number][] = [
  [0, 0.2, 1.42],
  [0, 0.11, 1.56],
  [0, 0.018, 1.76],
  [0, 0.018, 1.96],
];

/** Curtain wall segment with a row of merlons along its top. */
function Wall({
  p,
  rotY = 0,
  len,
  gap = false,
  wear = 0,
}: {
  p: [number, number, number];
  rotY?: number;
  len: number;
  gap?: boolean;
  wear?: number;
}) {
  const merlons = [];
  const count = 5;
  for (let i = 0; i < count; i++) {
    if (gap && (i === 2 || i === 3)) continue;
    const x = (i / (count - 1) - 0.5) * (len - 0.14);
    // Bases sink 0.01 into the wall top so the faces never sit coplanar.
    merlons.push(
      <BoxP key={i} p={[x, 0.28, 0]} size={[0.09, 0.08, 0.1]} color={CLAY.cream} />,
    );
  }
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <BoxP p={[0, 0, 0]} size={[len, 0.5, 0.13]} color={CLAY.cream} wear={wear} />
      {merlons}
    </group>
  );
}

/** A half-height wall still being raised, no merlons yet. */
function UnfinishedWall({
  p,
  rotY = 0,
  len,
  wear = 0,
}: {
  p: [number, number, number];
  rotY?: number;
  len: number;
  wear?: number;
}) {
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <BoxP p={[0, -0.13, 0]} size={[len, 0.24, 0.13]} color={CLAY.cream} wear={wear} />
      {/* Stepped, ragged top edge where the next courses will go */}
      <BoxP p={[-len * 0.28, 0.02, 0]} size={[len * 0.3, 0.07, 0.13]} color={CLAY.bone} wear={wear} />
      <BoxP p={[len * 0.2, -0.01, 0]} size={[len * 0.22, 0.05, 0.13]} color={CLAY.bone} wear={wear} />
    </group>
  );
}

/** Round corner tower with a crenellated rim — optionally turret-capped. */
function Tower({
  p,
  cap = false,
  accent,
  wear = 0,
}: {
  p: [number, number, number];
  cap?: boolean;
  accent?: string;
  wear?: number;
}) {
  return (
    <group position={p}>
      <Cyl p={[0, 0.4, 0]} rTop={0.15} rBot={0.17} h={0.8} color={CLAY.cream} wear={wear} />
      <Cyl p={[0, 0.83, 0]} rTop={0.18} rBot={0.18} h={0.08} color={CLAY.cream} wear={wear} />
      {cap ? (
        <>
          <mesh position={[0, 1.0, 0]} castShadow>
            <coneGeometry args={[0.19, 0.26, 16]} />
            {/* Turret roofs read as fitted stone, slightly darker */}
            <meshStandardMaterial color={CLAY.bone} roughness={0.85} />
          </mesh>
          {accent && (
            <>
              <Cyl p={[0, 1.2, 0]} rTop={0.006} rBot={0.006} h={0.14} color={CLAY.dim} />
              <BoxP p={[0.032, 1.24, 0]} size={[0.06, 0.035, 0.008]} color={accent} />
            </>
          )}
        </>
      ) : (
        <Crenels p={[0, 0.9, 0]} radius={0.14} count={7} size={[0.06, 0.07, 0.05]} />
      )}
    </group>
  );
}

/** The stump of a tower that hasn't been raised yet. */
function TowerStub({
  p,
  wear = 0,
}: {
  p: [number, number, number];
  wear?: number;
}) {
  return (
    <group position={p}>
      <Cyl p={[0, 0.14, 0]} rTop={0.16} rBot={0.17} h={0.28} color={CLAY.bone} wear={wear} />
      <StonePile p={[0.22, 0, 0.1]} r={[0, 0.6, 0]} />
    </group>
  );
}

/**
 * The Castle as a clay diorama on a stepped plinth. Its architecture is
 * driven by the readiness tier — the castle literally gets better or worse:
 *
 * - tier 0: half-built. Open front wall, missing towers, scaffolding and
 *   stacked stone, a single squat keep still being raised.
 * - tier 1: modest. Full walls, three towers, a one-tier keep.
 * - tier 2: the archetype — four towers, two-tier keep, spire.
 * - tier 3: fortified — turret roofs, banners, braziers along the walls.
 *
 * Weathering (wear) stains and roughens the surfaces rather than drawing
 * crack lines. Confirmed damage still topples the front-right tower and
 * breaks the front wall open.
 */
export function CastleModel({ params }: { params: StateParams }) {
  const { glow, accent, wear, tier, damaged } = params;
  const halfBuilt = tier === 0 && !damaged;
  const towerFallen = damaged;
  const way = params.pathway;
  const wayLit = way !== null && way >= 0.45;
  const litSlabs = way === null ? 0 : Math.round(way * ROAD.length);

  return (
    <group>
      <Plinth radius={1.3} />

      {/* Curtain walls. The front wall is still being raised at tier 0 and
          breaks open when damaged. */}
      {halfBuilt ? (
        <>
          <UnfinishedWall p={[-0.38, T + 0.25, 0.72]} len={0.5} wear={wear} />
          <UnfinishedWall p={[0.38, T + 0.25, 0.72]} len={0.5} wear={wear} />
          <Scaffold p={[-0.38, T, 0.86]} w={0.34} />
          <StonePile p={[0.3, T, 0.95]} r={[0, 0.3, 0]} />
        </>
      ) : (
        <Wall p={[0, T + 0.25, 0.72]} len={1.2} gap={damaged} wear={wear} />
      )}
      <Wall p={[0, T + 0.25, -0.72]} len={1.2} wear={wear} />
      <Wall p={[0.72, T + 0.25, 0]} rotY={Math.PI / 2} len={1.2} wear={wear} />
      <Wall p={[-0.72, T + 0.25, 0]} rotY={Math.PI / 2} len={1.2} wear={wear} />

      {/* Corner towers: they arrive as readiness grows. Back pair is always
          standing; the front pair is the last to be finished. */}
      <Tower p={[-0.72, T, -0.72]} cap={tier >= 3} wear={wear} />
      <Tower p={[0.72, T, -0.72]} cap={tier >= 3} accent={accent} wear={wear} />
      {tier >= 1 || damaged ? (
        <Tower p={[-0.72, T, 0.72]} cap={tier >= 3} wear={wear} />
      ) : (
        <TowerStub p={[-0.72, T, 0.72]} wear={wear} />
      )}
      {towerFallen ? (
        <>
          <Cyl
            p={[0.62, T + 0.17, 0.38]}
            r={[0.35, 0, 1.42]}
            rTop={0.15}
            rBot={0.17}
            h={0.8}
            color={CLAY.bone}
            wear={wear}
          />
          <PebblePile p={[0.78, T, 0.68]} seed={3} spread={0.16} />
        </>
      ) : tier >= 2 ? (
        <Tower p={[0.72, T, 0.72]} cap={tier >= 3} accent={accent} wear={wear} />
      ) : (
        <TowerStub p={[0.72, T, 0.72]} wear={wear} />
      )}

      {/* The keep grows with readiness: squat and unfinished, then one full
          tier, then the two-tier archetype with its spire. */}
      {halfBuilt ? (
        <>
          <Cyl p={[0, T + 0.35, 0]} rTop={0.32} rBot={0.35} h={0.7} color={CLAY.cream} wear={wear} />
          {/* First merlons of an unfinished parapet */}
          <BoxP p={[0.22, T + 0.74, 0.1]} size={[0.08, 0.07, 0.07]} color={CLAY.bone} />
          <BoxP p={[-0.18, T + 0.73, -0.16]} size={[0.08, 0.06, 0.07]} color={CLAY.bone} />
          <Scaffold p={[0.4, T, 0.06]} r={[0, Math.PI / 2, 0]} w={0.3} h={0.6} />
        </>
      ) : (
        <>
          <Cyl p={[0, T + 0.5, 0]} rTop={0.3} rBot={0.35} h={1.0} color={CLAY.cream} wear={wear} />
          <Cyl p={[0, T + 1.02, 0]} rTop={0.33} rBot={0.33} h={0.07} color={CLAY.cream} wear={wear} />
          <Crenels p={[0, T + 1.08, 0]} radius={0.28} count={9} size={[0.07, 0.08, 0.06]} />
          {tier >= 2 && (
            <>
              <Cyl p={[0, T + 1.24, 0]} rTop={0.19} rBot={0.22} h={0.45} color={CLAY.cream} wear={wear} />
              <Crenels p={[0, T + 1.49, 0]} radius={0.18} count={7} size={[0.06, 0.07, 0.05]} />
              <Spire p={[0, T + 1.6, 0]} h={0.32} />
              {tier >= 3 && (
                <BoxP p={[0.05, T + 1.72, 0]} size={[0.1, 0.05, 0.01]} color={accent} />
              )}
            </>
          )}
        </>
      )}

      {/* Gate: dark arched recess, arch outline, stairs down the plinth.
          At tier 0 the gateway is still an open construction site. */}
      {!halfBuilt && (
        <>
          <BoxP p={[0, T + 0.15, 0.776]} size={[0.24, 0.3, 0.03]} color={CLAY.deep} />
          <Arch p={[0, T + 0.3, 0.79]} radius={0.13} tube={0.028} />
          <GlowDot p={[0, T + 0.18, 0.79]} radius={0.045} s={[1, 1.6, 0.6]} color={accent} intensity={glow * 0.9} />
        </>
      )}
      <Stairs p={[0, T - 0.02, 0.82]} steps={6} width={0.32} />

      {/* Braziers flank the gate once the castle is fortified */}
      {tier >= 3 && !halfBuilt && (
        <>
          <GlowDot p={[-0.28, T + 0.42, 0.78]} radius={0.028} color={accent} intensity={glow * 1.3} />
          <GlowDot p={[0.28, T + 0.42, 0.78]} radius={0.028} color={accent} intensity={glow * 1.3} />
        </>
      )}

      {/* Keep windows */}
      <GlowDot p={[0.12, T + 0.72, 0.33]} radius={0.026} s={[1, 1.5, 0.6]} color={accent} intensity={glow} />
      {!halfBuilt && (
        <>
          <GlowDot p={[-0.13, T + 0.58, 0.32]} radius={0.026} s={[1, 1.5, 0.6]} color={accent} intensity={glow} />
          {tier >= 2 && (
            <GlowDot p={[0.05, T + 1.3, 0.21]} radius={0.024} s={[1, 1.5, 0.6]} color={accent} intensity={glow} />
          )}
        </>
      )}

      {/* Recovery — the way back. The castle's native metaphor is the
          gate: open and welcoming with a paved road lighting up the descent
          when the recovery plan is ready; sealed by a dropped portcullis
          with a dark, rubble-ended road when it isn't. */}
      {way !== null && (
        <group userData={{ anchor: "pathway" }}>
          {wayLit ? (
            /* Gate open: a timber threshold at the foot of the stairs */
            <BoxP p={[0, 0.3, 1.26]} size={[0.26, 0.026, 0.26]} color={CLAY.strut} />
          ) : (
            <>
              {/* Portcullis dropped across the gate: a dark iron lattice */}
              <group position={[0, T + 0.15, 0.798]}>
                {[-0.06, -0.02, 0.02, 0.06].map((x) => (
                  <BoxP key={x} p={[x, 0, 0]} size={[0.014, 0.3, 0.012]} color={CLAY.crack} />
                ))}
                {[-0.09, 0, 0.09].map((yb) => (
                  <BoxP key={yb} p={[0, yb, 0.004]} size={[0.17, 0.014, 0.01]} color={CLAY.crack} />
                ))}
              </group>
              {/* The road ends in stone that was never laid */}
              <StonePile p={[0.18, 0.11, 1.52]} r={[0, 0.7, 0]} />
            </>
          )}
          {ROAD.map((slab, i) => (
            <RoadSlab
              key={i}
              p={slab}
              lit={wayLit && i < litSlabs}
              accent={accent}
              intensity={0.7 + (way ?? 0) * 1.2}
            />
          ))}
          {/* Gate lantern marking the start of the route */}
          <Cyl p={[0.28, T + 0.07, 0.9]} rTop={0.01} rBot={0.014} h={0.14} color={CLAY.strut} />
          <GlowDot
            p={[0.28, T + 0.17, 0.9]}
            radius={0.026}
            color={accent}
            intensity={wayLit ? 1.2 + (way ?? 0) * 1.4 : 0.15}
          />
        </group>
      )}

      {/* Courtyard greenery */}
      <Tree p={[0.5, T, -0.42]} s={0.95} />
      <Pine p={[-0.5, T, 0.44]} s={0.9} />
      <Tree p={[-1.06, 0.25, 0.62]} s={0.7} />

      {/* Clouds drifting alongside */}
      <Cloud p={[-1.3, 1.8, -0.35]} s={1.05} />
      <Cloud p={[1.32, 2.1, -0.55]} s={0.75} />
    </group>
  );
}
