import {
  Arch,
  CLAY,
  Cloud,
  GlowDot,
  PLINTH_TOP,
  PebblePile,
  Plinth,
  Shard,
  Stairs,
  Strut,
} from "./shared";
import { type StateParams } from "./state";

const T = PLINTH_TOP;

/**
 * The Crystal Sanctuary: a cluster of tall faceted shards rising from the
 * stepped plinth in a cool porcelain-blue cast, approached through a
 * freestanding arch and a short run of stairs. A warm hearth glows at the
 * heart of the cluster.
 */
export function CrystalModel({ params }: { params: StateParams }) {
  const { glow, accent, wear, damaged, recovering } = params;
  const broken = damaged || recovering;
  const dimmed = wear >= 0.6 ? CLAY.coolDim : CLAY.cool;

  return (
    <group>
      <Plinth radius={1.15} />

      {/* The great shard — snapped when broken, its crown beside or above */}
      {broken ? (
        <>
          <Shard p={[0, T + 0.42, 0]} radius={0.3} h={0.85} color={dimmed} sides={5} />
          {recovering ? (
            <>
              <Shard
                p={[0.05, T + 1.32, 0]}
                r={[0, 0.4, 0.1]}
                radius={0.22}
                h={0.7}
                color={dimmed}
                sides={5}
              />
              <GlowDot p={[0.02, T + 0.95, 0]} radius={0.05} color={accent} intensity={glow * 1.6} />
              <Strut p={[0.32, T + 0.32, 0.12]} r={[0, 0, -0.4]} length={0.6} />
              <Strut p={[-0.28, T + 0.3, 0.16]} r={[0.12, 0, 0.42]} length={0.55} />
            </>
          ) : (
            <Shard
              p={[0.62, T + 0.14, 0.42]}
              r={[1.35, 0.4, 0.3]}
              radius={0.22}
              h={0.7}
              color={CLAY.coolDim}
              sides={5}
            />
          )}
        </>
      ) : (
        <Shard
          p={[0, T + 0.75, 0]}
          r={[0, 0.2, wear * -0.06]}
          radius={0.4}
          h={1.5}
          color={dimmed}
          sides={5}
        />
      )}

      {/* Companion shards leaning into the cluster */}
      <Shard
        p={[0.36, T + 0.5, 0.12]}
        r={[0, 0.7, -0.14 - wear * 0.18]}
        radius={0.28}
        h={1.0}
        color={dimmed}
        sides={5}
      />
      <Shard
        p={[-0.34, T + 0.4, -0.1]}
        r={[0, 1.3, 0.13 + wear * 0.12]}
        radius={0.24}
        h={0.8}
        color={dimmed}
        sides={5}
      />
      <Shard p={[-0.22, T + 0.26, 0.36]} r={[0, 0.5, 0.18]} radius={0.16} h={0.52} color={dimmed} sides={5} />
      <Shard p={[0.26, T + 0.19, -0.4]} r={[0, 1.8, -0.16]} radius={0.13} h={0.4} color={dimmed} sides={5} />

      {/* Scattered crystal chips on the platform */}
      <Shard p={[0.68, T + 0.09, -0.18]} radius={0.055} h={0.18} color={dimmed} sides={5} />
      <Shard p={[-0.66, T + 0.07, 0.3]} r={[0, 0.9, 0.1]} radius={0.045} h={0.15} color={dimmed} sides={5} />

      {/* Approach: freestanding arch and stairs down the plinth */}
      <Arch p={[0, T, 0.82]} radius={0.2} tube={0.032} />
      <Stairs p={[0, T - 0.02, 0.98]} steps={5} width={0.3} />

      {/* The hearth at the heart of the cluster */}
      <GlowDot p={[0.08, T + 0.18, 0.2]} radius={0.045} color={accent} intensity={glow * 0.9} />
      <GlowDot p={[-0.08, T + 0.6, 0.14]} radius={0.026} color={accent} intensity={glow * 0.7} />

      <Cloud p={[-1.15, 1.65, -0.4]} s={0.9} />
      <Cloud p={[1.2, 1.95, -0.5]} s={0.7} />

      {damaged && <PebblePile p={[0.4, T, 0.5]} color={CLAY.coolDim} seed={7} />}
    </group>
  );
}
