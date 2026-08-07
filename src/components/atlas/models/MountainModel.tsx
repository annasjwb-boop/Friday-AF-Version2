import {
  Barrel,
  BoxT,
  Crate,
  CylT,
  GrassIsland,
  ISLAND_TOP,
  Lantern,
  PathStones,
  Pennant,
  PlankDoor,
  Sconce,
  ShingleRoof,
  ToyBush,
  ToyGate,
  ToyMat,
  ToyPine,
  ToyRock,
  ToyTower,
  ToyTree,
  ToyWindow,
  WallBanner,
  TOY,
} from "./shared";

const T = ISLAND_TOP;

/** Smooth pinched-clay rock mass. */
function Peak({
  p,
  radius,
  h,
  color = TOY.rock,
}: {
  p: [number, number, number];
  radius: number;
  h: number;
  color?: string;
}) {
  return (
    <mesh position={p}>
      <coneGeometry args={[radius, h, 26]} />
      <ToyMat color={color} matte />
    </mesh>
  );
}

/**
 * The Mountain — a castle carved into a lavender crag: towers growing off
 * rock ledges, a stair snaking to the gate, pines at the treeline and the
 * summit tower flying its pennant above everything.
 */
export function MountainModel() {
  return (
    <group>
      <GrassIsland radius={1.3} />

      {/* The crag: overlapping faceted masses. */}
      <Peak p={[0, T + 0.75, -0.1]} radius={0.85} h={1.5} />
      <Peak p={[-0.45, T + 0.45, 0.25]} radius={0.55} h={0.9} color={TOY.rockDeep} />
      <Peak p={[0.5, T + 0.4, 0.1]} radius={0.5} h={0.8} color={TOY.rockDeep} />
      <Peak p={[0.15, T + 0.35, 0.52]} radius={0.4} h={0.7} />

      {/* Gate carved into the foot of the rock. */}
      <ToyGate p={[0, T, 0.72]} s={1.1} frame={TOY.stone} />
      <PlankDoor p={[0, T, 0.712]} s={1.1} />
      <BoxT p={[0, T + 0.02, 0.9]} size={[0.34, 0.05, 0.3]} color={TOY.stone} />
      <Sconce p={[-0.18, T + 0.3, 0.73]} />
      <Sconce p={[0.18, T + 0.3, 0.73]} />
      <Lantern p={[-0.24, T, 0.88]} />
      <Lantern p={[0.24, T, 0.88]} />
      <PathStones p={[0, T, 1.02]} count={2} seed={7} />
      <Barrel p={[0.4, T, 0.84]} />
      <Crate p={[-0.4, T, 0.86]} rotY={0.3} s={0.8} />

      {/* Rock outcrops shouldering out of the slopes. */}
      <ToyRock p={[-0.34, T + 0.42, 0.5]} s={1.4} color={TOY.rockDeep} />
      <ToyRock p={[0.42, T + 0.62, 0.34]} s={1.1} />
      <ToyRock p={[-0.12, T + 0.95, 0.4]} s={0.9} color={TOY.rockDeep} />

      {/* Ledge trail switchbacking up toward the west tower. */}
      <BoxT p={[-0.24, T + 0.2, 0.6]} r={[0, 0.3, 0]} size={[0.16, 0.05, 0.11]} color={TOY.stone} />
      <BoxT p={[-0.38, T + 0.34, 0.48]} r={[0, 0.55, 0]} size={[0.15, 0.05, 0.1]} color={TOY.stone} />
      <BoxT p={[-0.5, T + 0.48, 0.34]} r={[0, 0.8, 0]} size={[0.14, 0.05, 0.1]} color={TOY.stone} />

      {/* Ledge towers rooted in the rock faces. */}
      <ToyTower
        p={[-0.55, T + 0.62, 0.18]}
        rBody={0.13}
        h={0.5}
        roof={TOY.teal}
        trim={TOY.gold}
        roofH={0.3}
        windows={1}
        windowYaw={0.7}
      />
      <ToyTower
        p={[0.52, T + 0.55, 0.3]}
        rBody={0.12}
        h={0.45}
        roof={TOY.teal}
        roofH={0.28}
        windows={1}
        windowYaw={-0.5}
      />

      {/* Summit keep: a short drum perched on the peak, roofed and flagged. */}
      <CylT p={[0, T + 1.45, -0.1]} rTop={0.19} rBot={0.23} h={0.4} color={TOY.cream} seg={18} />
      <ToyWindow p={[0, T + 1.52, 0.09]} s={0.85} frame={TOY.creamShade} />
      <CylT p={[0, T + 1.68, -0.1]} rTop={0.24} rBot={0.24} h={0.06} color={TOY.creamShade} seg={18} />
      <ShingleRoof p={[0, T + 1.71, -0.1]} radius={0.26} h={0.4} color={TOY.tealDeep} trim={TOY.gold} />
      <Pennant p={[0, T + 2.08, -0.1]} h={0.26} color={TOY.gold} />
      <WallBanner p={[-0.15, T + 1.62, -0.02]} rotY={-0.55} s={0.85} />

      {/* Windows glowing straight out of the rock. */}
      <ToyWindow p={[-0.24, T + 0.55, 0.51]} rotY={-0.35} s={0.9} frame={TOY.rockDeep} />
      <ToyWindow p={[0.3, T + 0.85, 0.34]} rotY={0.5} s={0.8} frame={TOY.rockDeep} />

      {/* Treeline and scree — pines at altitude. */}
      <ToyPine p={[-0.95, T, 0.55]} s={1} />
      <ToyPine p={[1.0, T, -0.25]} s={0.9} />
      <ToyPine p={[-0.88, T, -0.5]} s={0.75} />
      <ToyTree p={[0.85, T, 0.62]} s={0.65} color={TOY.leafOrange} />
      <ToyBush p={[-1.0, T, -0.4]} />
      <ToyRock p={[-0.62, T + 0.04, 0.85]} s={0.9} />
      <ToyRock p={[0.6, T + 0.04, 0.88]} s={0.7} color={TOY.rockDeep} />
    </group>
  );
}
