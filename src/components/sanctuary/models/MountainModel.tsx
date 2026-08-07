import {
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
  Shard,
  Stairs,
  Strut,
} from "./shared";
import { type StateParams } from "./state";

const T = PLINTH_TOP;

/**
 * The Mountain Stronghold: a faceted twin-peak massif on the plinth, with
 * switchback stairs climbing to a walled terrace holding a small watch
 * tower — the stronghold — its window glowing. Pines at the foot, a cloud
 * snagged on the summit.
 */
export function MountainModel({ params }: { params: StateParams }) {
  const { glow, accent, wear, damaged, recovering } = params;

  return (
    <group>
      <Plinth radius={1.25} />

      {/* The massif: faceted main peak and shoulder */}
      <Shard p={[-0.15, T + 0.85, -0.15]} r={[0, 0.5, 0]} radius={0.85} h={1.7} color={CLAY.cream} sides={6} />
      <Shard
        p={[0.62, T + 0.5, 0.05]}
        r={[0, 1.1, damaged ? -0.2 : 0]}
        radius={0.5}
        h={1.0}
        color={CLAY.bone}
        sides={5}
      />
      <Shard p={[-0.75, T + 0.3, 0.3]} r={[0, 2, 0.08]} radius={0.3} h={0.6} color={CLAY.bone} sides={5} />

      {/* The stronghold terrace on the front face */}
      <Cyl p={[0.08, T + 0.62, 0.52]} rTop={0.26} rBot={0.3} h={0.1} color={CLAY.bone} />
      <Crenels p={[0.08, T + 0.69, 0.52]} radius={0.24} count={8} size={[0.05, 0.05, 0.04]} color={CLAY.bone} />
      <Cyl p={[0.08, T + 0.82, 0.52]} rTop={0.09} rBot={0.11} h={0.32} color={CLAY.cream} />
      <Crenels p={[0.08, T + 1.0, 0.52]} radius={0.09} count={6} size={[0.04, 0.05, 0.035]} />
      <GlowDot p={[0.08, T + 0.86, 0.63]} radius={0.026} s={[1, 1.5, 0.6]} color={accent} intensity={glow} />

      {/* Switchback stairs: two runs meeting at a small landing */}
      {!damaged && (
        <>
          <Stairs p={[0.42, T + 0.56, 0.62]} r={[0, 0.5, 0]} steps={5} width={0.16} />
          <Stairs p={[0.62, T + 0.28, 0.78]} r={[0, -0.4, 0]} steps={5} width={0.16} />
        </>
      )}
      <BoxP p={[0.58, T + 0.28, 0.72]} size={[0.2, 0.05, 0.2]} color={CLAY.bone} />

      {/* Landslide: stairs gone, rubble spilled down the face */}
      {damaged && (
        <>
          <PebblePile p={[0.5, T + 0.1, 0.7]} seed={5} spread={0.24} count={7} />
          <PebblePile p={[0.24, T, 0.95]} seed={9} spread={0.18} count={5} />
        </>
      )}

      {/* Crack across the peak face; gold while healing */}
      {(wear >= 0.3 || recovering) && (
        <Seam
          p={[-0.28, T + 1.05, 0.42]}
          r={[0.25, 0, 0.5]}
          length={0.4}
          intensity={recovering ? glow * 2.2 : 0}
        />
      )}
      {wear >= 0.6 && !recovering && (
        <Seam p={[0.35, T + 0.5, 0.62]} r={[0.2, 0, -0.5]} length={0.26} />
      )}

      {recovering && (
        <>
          <Strut p={[0.88, T + 0.4, 0.35]} r={[0, 0, -0.45]} length={0.75} />
          <Strut p={[0.4, T + 0.35, 0.9]} r={[0.4, 0, 0]} length={0.6} />
        </>
      )}

      {/* Pines at the foot of the massif */}
      <Pine p={[-0.85, T, 0.62]} s={1} />
      <Pine p={[-1.0, T, 0.35]} s={0.75} />
      <Pine p={[0.95, T, 0.42]} s={0.85} />

      {/* A cloud snagged on the summit, another drifting past */}
      <Cloud p={[0.5, T + 1.55, -0.2]} s={0.8} />
      <Cloud p={[-1.3, 1.9, -0.4]} s={1} />
    </group>
  );
}
