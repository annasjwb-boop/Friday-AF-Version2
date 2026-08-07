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
  Seam,
  Spire,
  Stairs,
  Strut,
  Tree,
} from "./shared";
import { type StateParams } from "./state";

const T = PLINTH_TOP;

/** Curtain wall segment with a row of merlons along its top. */
function Wall({
  p,
  rotY = 0,
  len,
  gap = false,
}: {
  p: [number, number, number];
  rotY?: number;
  len: number;
  gap?: boolean;
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
      <BoxP p={[0, 0, 0]} size={[len, 0.5, 0.13]} color={CLAY.cream} />
      {merlons}
    </group>
  );
}

/** Round corner tower with a crenellated rim. */
function Tower({
  p,
  lean = 0,
}: {
  p: [number, number, number];
  lean?: number;
}) {
  return (
    <group position={p} rotation={[0, 0, lean]}>
      <Cyl p={[0, 0.4, 0]} rTop={0.15} rBot={0.17} h={0.8} color={CLAY.cream} />
      <Cyl p={[0, 0.83, 0]} rTop={0.18} rBot={0.18} h={0.08} color={CLAY.cream} />
      <Crenels p={[0, 0.9, 0]} radius={0.14} count={7} size={[0.06, 0.07, 0.05]} />
    </group>
  );
}

/**
 * The Castle as a clay diorama on a stepped plinth: a crenellated curtain
 * wall with four corner towers around a two-tier central keep, a gated
 * entrance with stairs spilling down the steps, courtyard trees, and a
 * pair of clouds drifting alongside.
 */
export function CastleModel({ params }: { params: StateParams }) {
  const { glow, accent, wear, damaged, recovering } = params;
  const towerFallen = damaged;
  const towerLean = !damaged && wear >= 0.6 ? -0.14 : 0;

  return (
    <group>
      <Plinth radius={1.3} />

      {/* Curtain walls (front wall breaks open when damaged) */}
      <Wall p={[0, T + 0.25, 0.72]} len={1.2} gap={damaged} />
      <Wall p={[0, T + 0.25, -0.72]} len={1.2} />
      <Wall p={[0.72, T + 0.25, 0]} rotY={Math.PI / 2} len={1.2} />
      <Wall p={[-0.72, T + 0.25, 0]} rotY={Math.PI / 2} len={1.2} />

      {/* Corner towers — front-right topples when damaged */}
      <Tower p={[-0.72, T, -0.72]} />
      <Tower p={[0.72, T, -0.72]} />
      <Tower p={[-0.72, T, 0.72]} />
      {towerFallen ? (
        <>
          <Cyl
            p={[0.62, T + 0.17, 0.38]}
            r={[0.35, 0, 1.42]}
            rTop={0.15}
            rBot={0.17}
            h={0.8}
            color={CLAY.bone}
          />
          <PebblePile p={[0.78, T, 0.68]} seed={3} spread={0.16} />
        </>
      ) : (
        <group>
          <Tower p={[0.72, T, 0.72]} lean={towerLean} />
          {recovering && (
            <>
              <Strut p={[0.94, T + 0.38, 0.62]} r={[0, 0, -0.35]} length={0.7} />
              <Strut p={[0.6, T + 0.34, 0.96]} r={[0.35, 0, 0]} length={0.62} />
            </>
          )}
        </group>
      )}

      {/* The keep: two crenellated tiers and a spire */}
      <Cyl p={[0, T + 0.5, 0]} rTop={0.3} rBot={0.35} h={1.0} color={CLAY.cream} />
      <Cyl p={[0, T + 1.02, 0]} rTop={0.33} rBot={0.33} h={0.07} color={CLAY.cream} />
      <Crenels p={[0, T + 1.08, 0]} radius={0.28} count={9} size={[0.07, 0.08, 0.06]} />
      <Cyl p={[0, T + 1.24, 0]} rTop={0.19} rBot={0.22} h={0.45} color={CLAY.cream} />
      <Crenels p={[0, T + 1.49, 0]} radius={0.18} count={7} size={[0.06, 0.07, 0.05]} />
      <Spire p={[0, T + 1.6, 0]} h={0.32} />

      {/* Gate: dark arched recess, arch outline, stairs down the plinth.
          The panel stands proud of the wall face — coplanar faces z-fight. */}
      <BoxP p={[0, T + 0.15, 0.776]} size={[0.24, 0.3, 0.03]} color={CLAY.deep} />
      <Arch p={[0, T + 0.3, 0.79]} radius={0.13} tube={0.028} />
      <Stairs p={[0, T - 0.02, 0.82]} steps={6} width={0.32} />
      <GlowDot p={[0, T + 0.18, 0.79]} radius={0.045} s={[1, 1.6, 0.6]} color={accent} intensity={glow * 0.9} />

      {/* Keep windows */}
      <GlowDot p={[0.12, T + 0.72, 0.33]} radius={0.026} s={[1, 1.5, 0.6]} color={accent} intensity={glow} />
      <GlowDot p={[-0.13, T + 0.58, 0.32]} radius={0.026} s={[1, 1.5, 0.6]} color={accent} intensity={glow} />
      <GlowDot p={[0.05, T + 1.3, 0.21]} radius={0.024} s={[1, 1.5, 0.6]} color={accent} intensity={glow} />

      {/* Courtyard greenery */}
      <Tree p={[0.5, T, -0.42]} s={0.95} />
      <Pine p={[-0.5, T, 0.44]} s={0.9} />
      <Tree p={[-1.06, 0.25, 0.62]} s={0.7} />

      {/* Clouds drifting alongside */}
      <Cloud p={[-1.3, 1.8, -0.35]} s={1.05} />
      <Cloud p={[1.32, 2.1, -0.55]} s={0.75} />

      {/* Cracks; the keep crack heals as gold while recovering */}
      {(wear >= 0.3 || recovering) && (
        <Seam
          p={[0.16, T + 0.72, 0.31]}
          r={[0.1, 0, 0.42]}
          length={0.3}
          intensity={recovering ? glow * 2.2 : 0}
        />
      )}
      {wear >= 0.6 && !recovering && (
        <Seam p={[-0.45, T + 0.28, 0.68]} r={[0, 0, 0.6]} length={0.2} />
      )}
    </group>
  );
}
