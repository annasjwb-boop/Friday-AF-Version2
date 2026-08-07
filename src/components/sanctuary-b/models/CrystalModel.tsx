import {
  Arch,
  CLAY,
  Cloud,
  GlowDot,
  PLINTH_TOP,
  PebblePile,
  Plinth,
  PulseDot,
  Shard,
  Stairs,
  Strut,
} from "./shared";
import { type StateParams } from "./state";

const T = PLINTH_TOP;

/** Where seed crystals sprout around the cluster: [x, z, height, yaw]. */
const SEEDS: [number, number, number, number][] = [
  [0.62, 0.55, 0.22, 0.4],
  [-0.55, 0.6, 0.18, 1.1],
  [0.85, 0.05, 0.15, 2.0],
  [-0.78, -0.25, 0.2, 0.7],
  [0.3, 0.78, 0.13, 1.6],
];

/** A young crystal glowing from within — the reserve it would regrow from. */
function SeedCrystal({
  x,
  z,
  h,
  yaw,
  accent,
  intensity,
}: {
  x: number;
  z: number;
  h: number;
  yaw: number;
  accent: string;
  intensity: number;
}) {
  return (
    <mesh position={[x, T + h / 2, z]} rotation={[0, yaw, 0.06]} castShadow>
      <coneGeometry args={[h * 0.32, h, 5]} />
      <meshStandardMaterial
        color={intensity > 0 ? CLAY.cool : CLAY.coolDim}
        emissive={accent}
        emissiveIntensity={intensity}
        flatShading
        roughness={0.5}
      />
    </mesh>
  );
}

/**
 * The Crystal Sanctuary: a cluster of tall faceted shards rising from the
 * stepped plinth in a cool porcelain-blue cast, approached through a
 * freestanding arch and a short run of stairs. A warm hearth glows at the
 * heart of the cluster. The crystal grows with the readiness tier: a
 * budding cluster propped by struts at 0, a modest spire at 1, the full
 * archetype at 2, and an extra crown shard with a brighter heart at 3.
 */
export function CrystalModel({ params }: { params: StateParams }) {
  const { glow, accent, wear, tier, damaged, recovering } = params;
  const broken = damaged || recovering;
  const dimmed = wear >= 0.6 ? CLAY.coolDim : CLAY.cool;
  // How far the great shard has grown.
  const mainH = tier === 0 ? 0.85 : tier === 1 ? 1.15 : 1.5;
  const way = params.pathway;
  const wayLit = way !== null && way >= 0.45;
  const seedCount = way === null ? 0 : Math.round(way * SEEDS.length);

  return (
    <group>
      <Plinth radius={1.15} />

      {/* The great shard — snapped when broken, its crown beside or above */}
      {broken ? (
        <>
          <Shard p={[0, T + 0.42, 0]} radius={0.3} h={0.85} color={dimmed} sides={5} />
          {recovering ? (
            <>
              {/* The crown hovers back into place, drawn by the inner light */}
              <Shard
                p={[0.05, T + 1.32, 0]}
                r={[0, 0.4, 0.1]}
                radius={0.22}
                h={0.7}
                color={dimmed}
                sides={5}
              />
              <GlowDot p={[0.02, T + 0.95, 0]} radius={0.05} color={accent} intensity={glow * 1.6} />
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
        <>
          <Shard
            p={[0, T + mainH / 2, 0]}
            r={[0, 0.2, wear * -0.06]}
            radius={0.4}
            h={mainH}
            color={dimmed}
            sides={5}
            wear={wear}
          />
          {/* Still growing: props hold the young shard steady */}
          {tier === 0 && (
            <>
              <Strut p={[0.3, T + 0.26, 0.14]} r={[0, 0, -0.42]} length={0.5} />
              <Strut p={[-0.26, T + 0.24, 0.18]} r={[0.14, 0, 0.44]} length={0.46} />
            </>
          )}
          {/* Fully realized: a crown shard rises beside the great one */}
          {tier >= 3 && (
            <>
              <Shard p={[-0.14, T + 1.35, 0.08]} r={[0, 0.9, 0.08]} radius={0.14} h={0.5} color={dimmed} sides={5} />
              <GlowDot p={[0, T + 0.85, 0.1]} radius={0.032} color={accent} intensity={glow * 1.2} />
            </>
          )}
        </>
      )}

      {/* Companion shards leaning into the cluster */}
      <Shard
        p={[0.36, T + 0.5, 0.12]}
        r={[0, 0.7, -0.14 - wear * 0.18]}
        radius={0.28}
        h={1.0}
        color={dimmed}
        sides={5}
        wear={wear}
      />
      <Shard
        p={[-0.34, T + 0.4, -0.1]}
        r={[0, 1.3, 0.13 + wear * 0.12]}
        radius={0.24}
        h={0.8}
        color={dimmed}
        sides={5}
        wear={wear}
      />
      <Shard p={[-0.22, T + 0.26, 0.36]} r={[0, 0.5, 0.18]} radius={0.16} h={0.52} color={dimmed} sides={5} />
      <Shard p={[0.26, T + 0.19, -0.4]} r={[0, 1.8, -0.16]} radius={0.13} h={0.4} color={dimmed} sides={5} />

      {/* Scattered crystal chips on the platform */}
      <Shard p={[0.68, T + 0.09, -0.18]} radius={0.055} h={0.18} color={dimmed} sides={5} />
      <Shard p={[-0.66, T + 0.07, 0.3]} r={[0, 0.9, 0.1]} radius={0.045} h={0.15} color={dimmed} sides={5} />

      {/* Approach: freestanding arch and stairs down the plinth */}
      <Arch p={[0, T, 0.82]} radius={0.2} tube={0.032} />
      <Stairs p={[0, T - 0.02, 0.98]} steps={5} width={0.3} />

      {/* Recovery — the way back. Crystals don't evacuate; they regrow.
          Recovery readiness is stored regenerative light: a pulsing heart
          reserve in the cluster's crevice and glowing seed crystals
          multiplying around the base. Weak recovery leaves the heart near
          dark and only inert, unlit seeds. */}
      {way !== null && (
        <group userData={{ anchor: "pathway" }}>
          <PulseDot
            p={[0.12, T + 0.34, 0.28]}
            radius={0.05}
            color={accent}
            base={wayLit ? 1.2 + (way ?? 0) * 2 : 0.18}
            phase={0}
          />
          {SEEDS.slice(0, Math.max(seedCount, 1)).map(([x, z, h, yaw], i) => (
            <SeedCrystal
              key={i}
              x={x}
              z={z}
              h={h}
              yaw={yaw}
              accent={accent}
              intensity={wayLit && i < seedCount ? 0.5 + (way ?? 0) * 0.9 : 0}
            />
          ))}
        </group>
      )}

      {/* The hearth at the heart of the cluster */}
      <GlowDot p={[0.08, T + 0.18, 0.2]} radius={0.045} color={accent} intensity={glow * 0.9} />
      <GlowDot p={[-0.08, T + 0.6, 0.14]} radius={0.026} color={accent} intensity={glow * 0.7} />

      <Cloud p={[-1.15, 1.65, -0.4]} s={0.9} />
      <Cloud p={[1.2, 1.95, -0.5]} s={0.7} />

      {damaged && <PebblePile p={[0.4, T, 0.5]} color={CLAY.coolDim} seed={7} />}
    </group>
  );
}
