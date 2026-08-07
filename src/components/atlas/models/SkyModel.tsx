import {
  Barrel,
  Crate,
  CylT,
  Dormer,
  Lantern,
  MerlonRow,
  PathStones,
  PlankDoor,
  Sconce,
  SphereT,
  Sprinkles,
  StonePatch,
  ToyBush,
  ToyCloud,
  ToyGate,
  ToyMat,
  ToyPine,
  ToyTower,
  ToyWall,
  WallBanner,
  TOY,
} from "./shared";

/** Top surface of the floating island. */
const F = 0.98;

/**
 * The Sky Castle — the same storybook masonry lifted onto a floating
 * island: grass on top, roots of rock tapering below, clouds and stray
 * boulders drifting alongside. The gap of open air beneath is the point.
 */
export function SkyModel() {
  return (
    <group>
      {/* The floating island: grass cap over a tapering rock root. */}
      <mesh position={[0, F - 0.38, 0]}>
        <coneGeometry args={[0.82, 0.85, 26]} />
        <ToyMat color={TOY.rock} matte />
      </mesh>
      <mesh position={[0, F - 0.72, 0]}>
        <coneGeometry args={[0.34, 0.5, 22]} />
        <ToyMat color={TOY.rockDeep} matte />
      </mesh>
      <CylT p={[0, F - 0.05, 0]} rTop={0.88} rBot={0.8} h={0.12} color={TOY.grass} seg={28} matte />
      <mesh position={[0, F - 0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.85, 0.05, 10, 28]} />
        <ToyMat color={TOY.grass} matte />
      </mesh>
      <Sprinkles p={[0, F + 0.02, 0]} radius={0.62} seed={9} count={8} />

      {/* A compact castle riding the island. */}
      <ToyWall p={[0, F, 0.42]} len={0.8} h={0.32} cap={TOY.slate} merlons={4} />
      <ToyGate p={[0, F, 0.5]} s={0.85} frame={TOY.rust} />
      <PlankDoor p={[0, F, 0.493]} s={0.85} />
      <Sconce p={[-0.13, F + 0.2, 0.505]} />
      <Sconce p={[0.13, F + 0.2, 0.505]} />
      <Lantern p={[0.18, F, 0.6]} h={0.12} />
      <PathStones p={[0, F, 0.6]} count={2} seed={4} />
      <Barrel p={[-0.35, F, 0.52]} s={0.8} />
      <Crate p={[0.4, F, 0.4]} rotY={0.4} s={0.75} />
      <ToyTower p={[-0.4, F, 0.18]} rBody={0.13} h={0.5} roof={TOY.steel} windows={1} windowYaw={0.6} />
      <ToyTower p={[0.4, F, 0.18]} rBody={0.13} h={0.5} roof={TOY.steel} windows={1} windowYaw={-0.6} />
      <ToyTower
        p={[0, F, -0.18]}
        rBody={0.19}
        h={0.95}
        roof={TOY.navy}
        trim={TOY.slate}
        roofH={0.42}
        flag
        flagColor={TOY.rust}
        windows={2}
        windowYaw={0.3}
      />
      <Dormer p={[0, F + 1.1, 0.03]} s={0.7} roof={TOY.navy} />
      <StonePatch p={[-0.06, F + 0.35, 0.025]} w={0.24} h={0.4} seed={8} />
      <WallBanner p={[-0.12, F + 0.6, -0.02]} rotY={-0.6} s={0.85} />
      <MerlonRow p={[0, F + 0.36, -0.52]} len={0.5} count={3} color={TOY.slate} />
      <ToyPine p={[0.55, F, -0.42]} s={0.6} />
      <ToyBush p={[-0.55, F, -0.4]} s={0.9} />

      {/* Moss dripping off the island's underside. */}
      <SphereT p={[0.68, F - 0.12, 0.32]} radius={0.05} color={TOY.grassDeep} s={[1, 1.7, 1]} matte />
      <SphereT p={[-0.6, F - 0.14, 0.45]} radius={0.04} color={TOY.grassDeep} s={[1, 1.8, 1]} matte />
      <SphereT p={[-0.05, F - 0.11, 0.78]} radius={0.045} color={TOY.grassDeep} s={[1, 1.6, 1]} matte />

      {/* Stray boulders caught in the island's wake. */}
      <mesh position={[-0.95, F - 0.45, 0.3]} scale={[1, 0.82, 0.9]}>
        <icosahedronGeometry args={[0.11, 1]} />
        <ToyMat color={TOY.rock} matte />
      </mesh>
      <mesh position={[0.9, F - 0.2, -0.35]} scale={[1, 0.85, 1]}>
        <icosahedronGeometry args={[0.08, 1]} />
        <ToyMat color={TOY.rockDeep} matte />
      </mesh>
      <mesh position={[0.55, F - 0.75, 0.5]}>
        <icosahedronGeometry args={[0.06, 1]} />
        <ToyMat color={TOY.rock} matte />
      </mesh>

      {/* Clouds threading between ground and island. */}
      <ToyCloud p={[-0.85, F - 0.15, 0.55]} s={0.9} />
      <ToyCloud p={[0.95, F + 0.4, 0.2]} s={0.7} />
      <ToyCloud p={[0.2, F - 0.6, -0.7]} s={0.8} />
    </group>
  );
}
