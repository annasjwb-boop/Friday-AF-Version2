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
  PulseDot,
  Scaffold,
  Shard,
  Stairs,
  StonePile,
} from "./shared";
import { type StateParams } from "./state";

const T = PLINTH_TOP;

/** Lantern niches carved beside the descent, terrace to plinth foot. */
const NICHES: [number, number, number][] = [
  [0.48, T + 0.52, 0.68],
  [0.62, T + 0.34, 0.8],
  [0.55, T + 0.16, 0.98],
  [0.35, T + 0.04, 1.14],
  [0.18, 0.12, 1.32],
];

/**
 * The Mountain Stronghold: a faceted twin-peak massif on the plinth, with
 * switchback stairs climbing to a walled terrace holding a small watch
 * tower — the stronghold — its window glowing. Pines at the foot, a cloud
 * snagged on the summit. The stronghold builds out with the readiness
 * tier: bare terrace and scaffolding at 0, a plain tower at 1, the
 * archetype at 2, and a taller banner-topped watchtower at 3.
 */
export function MountainModel({ params }: { params: StateParams }) {
  const { glow, accent, wear, tier, damaged } = params;
  const halfBuilt = tier === 0 && !damaged;
  const way = params.pathway;
  const wayLit = way !== null && way >= 0.45;
  const litNiches = way === null ? 0 : Math.round(way * NICHES.length);

  return (
    <group>
      <Plinth radius={1.25} />

      {/* The massif: faceted main peak and shoulder */}
      <Shard p={[-0.15, T + 0.85, -0.15]} r={[0, 0.5, 0]} radius={0.85} h={1.7} color={CLAY.cream} sides={6} wear={wear} />
      <Shard
        p={[0.62, T + 0.5, 0.05]}
        r={[0, 1.1, damaged ? -0.2 : 0]}
        radius={0.5}
        h={1.0}
        color={CLAY.bone}
        sides={5}
        wear={wear}
      />
      <Shard p={[-0.75, T + 0.3, 0.3]} r={[0, 2, 0.08]} radius={0.3} h={0.6} color={CLAY.bone} sides={5} wear={wear} />

      {/* The stronghold terrace on the front face */}
      <Cyl p={[0.08, T + 0.62, 0.52]} rTop={0.26} rBot={0.3} h={0.1} color={CLAY.bone} wear={wear} />
      {halfBuilt ? (
        <>
          {/* Foundations laid, walls not yet raised */}
          <Cyl p={[0.08, T + 0.7, 0.52]} rTop={0.1} rBot={0.11} h={0.08} color={CLAY.bone} wear={wear} />
          <Scaffold p={[0.26, T + 0.66, 0.6]} r={[0, -0.4, 0]} w={0.2} h={0.28} />
          <StonePile p={[-0.1, T + 0.67, 0.62]} r={[0, 0.5, 0]} />
        </>
      ) : (
        <>
          <Crenels p={[0.08, T + 0.69, 0.52]} radius={0.24} count={8} size={[0.05, 0.05, 0.04]} color={CLAY.bone} />
          <Cyl
            p={[0.08, T + (tier >= 3 ? 0.88 : 0.82), 0.52]}
            rTop={0.09}
            rBot={0.11}
            h={tier >= 3 ? 0.44 : 0.32}
            color={CLAY.cream}
            wear={wear}
          />
          {tier >= 2 && (
            <Crenels p={[0.08, T + (tier >= 3 ? 1.12 : 1.0), 0.52]} radius={0.09} count={6} size={[0.04, 0.05, 0.035]} />
          )}
          {tier >= 3 && (
            <>
              <Cyl p={[0.08, T + 1.22, 0.52]} rTop={0.006} rBot={0.006} h={0.14} color={CLAY.dim} />
              <BoxP p={[0.115, T + 1.26, 0.52]} size={[0.06, 0.035, 0.008]} color={accent} />
              <GlowDot p={[0.24, T + 0.7, 0.64]} radius={0.022} color={accent} intensity={glow * 1.3} />
            </>
          )}
          <GlowDot p={[0.08, T + 0.86, 0.63]} radius={0.026} s={[1, 1.5, 0.6]} color={accent} intensity={glow} />
        </>
      )}

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

      {/* Recovery — the way back. A mountain's lifeline is its carved
          descent: lantern niches light up in sequence down the switchbacks
          and a supply cache waits stocked at the foot when the recovery
          plan is ready. When it isn't, the niches are dark, rubble blocks
          the landing, and the cache sits empty. */}
      {way !== null && (
        <group userData={{ anchor: "pathway" }}>
          {NICHES.map((pt, i) => (
            <PulseDot
              key={i}
              p={pt}
              radius={0.022}
              color={accent}
              base={wayLit && i < litNiches ? (1.1 + (way ?? 0) * 1.2) * (1 - i * 0.08) : 0.1}
              phase={i * 0.8}
            />
          ))}
          {/* Supply cache carved into the shoulder's foot */}
          <BoxP p={[0.93, T + 0.09, 0.42]} r={[0, 0.7, 0]} size={[0.18, 0.15, 0.06]} color={CLAY.deep} />
          {wayLit ? (
            <>
              {/* Stocked: crates staged and a lantern by the cache mouth */}
              <BoxP p={[1.0, T + 0.04, 0.54]} r={[0, 0.5, 0]} size={[0.09, 0.08, 0.09]} color={CLAY.bone} />
              <BoxP p={[0.9, T + 0.04, 0.6]} r={[0, 0.2, 0]} size={[0.08, 0.07, 0.08]} color={CLAY.dim} />
              <BoxP p={[0.96, T + 0.11, 0.57]} r={[0, 0.8, 0]} size={[0.07, 0.06, 0.07]} color={CLAY.bone} />
              <Cyl p={[1.1, T + 0.07, 0.46]} rTop={0.008} rBot={0.012} h={0.14} color={CLAY.strut} />
              <GlowDot
                p={[1.1, T + 0.17, 0.46]}
                radius={0.024}
                color={accent}
                intensity={1.2 + (way ?? 0) * 1.4}
              />
            </>
          ) : (
            /* Rockfall across the landing: the descent is blocked */
            !damaged && <PebblePile p={[0.6, T + 0.28, 0.8]} seed={11} spread={0.13} count={5} />
          )}
        </group>
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
