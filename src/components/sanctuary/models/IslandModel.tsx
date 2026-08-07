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
  Plinth,
  Seam,
  Shard,
  Strut,
  Tree,
} from "./shared";
import { type StateParams } from "./state";

const T = PLINTH_TOP;

/**
 * The Island Fortress: the plinth's top step becomes a disc of water, with
 * a rocky island at its center carrying a walled round fort. A slender
 * arched bridge crosses from the plinth rim to the island gate.
 */
export function IslandModel({ params }: { params: StateParams }) {
  const { glow, accent, wear, threat, damaged, recovering } = params;
  const waterY = T + 0.012 + threat * 0.05;
  const bridgeBroken = damaged;

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
      <Shard p={[0, T + 0.16, 0]} r={[0, 0.4, 0]} radius={0.62} h={0.55} color={CLAY.bone} sides={7} />
      <Cyl p={[0, T + 0.3, 0]} rTop={0.44} rBot={0.5} h={0.14} color={CLAY.cream} />

      {/* Fort: ring wall, gate, and central tower */}
      <Cyl p={[0, T + 0.46, 0]} rTop={0.4} rBot={0.42} h={0.22} color={CLAY.cream} />
      <Crenels p={[0, T + 0.59, 0]} radius={0.38} count={11} size={[0.06, 0.06, 0.05]} />
      <BoxP p={[0, T + 0.44, 0.4]} size={[0.16, 0.18, 0.04]} color={CLAY.deep} />
      <Cyl p={[0, T + 0.72, 0]} rTop={0.18} rBot={0.21} h={0.5} color={CLAY.cream} />
      <Crenels p={[0, T + 0.99, 0]} radius={0.17} count={7} size={[0.05, 0.06, 0.04]} />
      <Cyl p={[0, T + 1.04, 0]} rTop={0.02} rBot={0.02} h={0.14} color={CLAY.cream} />
      <BoxP p={[0.045, T + 1.09, 0]} size={[0.09, 0.05, 0.012]} color={accent} />

      {/* Windows */}
      <GlowDot p={[0.08, T + 0.78, 0.19]} radius={0.024} s={[1, 1.5, 0.6]} color={accent} intensity={glow} />
      <GlowDot p={[-0.09, T + 0.66, 0.18]} radius={0.024} s={[1, 1.5, 0.6]} color={accent} intensity={glow} />
      <GlowDot p={[0, T + 0.35, 0.41]} radius={0.03} s={[1, 1.4, 0.6]} color={accent} intensity={glow * 0.8} />

      {/* The bridge: arch over the water plus a slender deck */}
      <Arch p={[0.78, T - 0.02, 0.35]} r={[0, 0.42, 0]} radius={0.16} tube={0.025} />
      {bridgeBroken ? (
        <>
          {/* Deck snapped: halves tipped into the water */}
          <BoxP p={[0.52, T + 0.06, 0.26]} r={[0.15, 0.42, -0.4]} size={[0.34, 0.035, 0.14]} color={CLAY.bone} />
          <BoxP p={[1.02, T + 0.02, 0.44]} r={[-0.1, 0.42, 0.35]} size={[0.3, 0.035, 0.14]} color={CLAY.bone} />
        </>
      ) : (
        <>
          <BoxP p={[0.78, T + 0.12, 0.35]} r={[0, 0.42, 0]} size={[0.78, 0.035, 0.14]} color={CLAY.cream} />
          {recovering && (
            <>
              <Strut p={[0.62, T + 0.02, 0.3]} r={[0, 0, 0.12]} length={0.24} radius={0.012} />
              <Strut p={[0.95, T + 0.02, 0.41]} r={[0, 0, -0.12]} length={0.24} radius={0.012} />
              <Seam p={[0.78, T + 0.13, 0.35]} r={[Math.PI / 2, 0, -0.42 + Math.PI / 2]} length={0.3} intensity={glow * 2} />
            </>
          )}
        </>
      )}

      {/* Shoreline wear: erosion cracks on the island rock */}
      {wear >= 0.3 && !recovering && (
        <Seam p={[-0.32, T + 0.24, 0.34]} r={[0.3, 0, 0.7]} length={0.2} />
      )}
      {wear >= 0.6 && !recovering && (
        <Seam p={[0.3, T + 0.2, -0.36]} r={[-0.3, 0, -0.6]} length={0.18} />
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
