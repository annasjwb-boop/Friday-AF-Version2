import {
  ArrowSlit,
  Barrel,
  BoxT,
  Buttress,
  Crate,
  CylT,
  Dormer,
  GrassIsland,
  ISLAND_TOP,
  Ivy,
  Lantern,
  MerlonRing,
  PathStones,
  PlankDoor,
  Sconce,
  ShingleRoof,
  StonePatch,
  ToyBush,
  ToyGate,
  ToyMat,
  ToyPine,
  ToyTree,
  ToyWall,
  ToyWindow,
  WallBanner,
  TOY,
} from "./shared";

const T = ISLAND_TOP;

/** One tapering drum of the keep with a contrasting cap course. */
function Tier({
  y,
  r,
  h,
  windows,
}: {
  y: number;
  r: number;
  h: number;
  windows: number[];
}) {
  return (
    <group position={[0, y, 0]}>
      <CylT p={[0, h / 2, 0]} rTop={r} rBot={r * 1.14} h={h} color={TOY.cream} seg={22} />
      <CylT p={[0, h + 0.03, 0]} rTop={r * 1.24} rBot={r * 1.24} h={0.07} color={TOY.slate} seg={22} />
      {windows.map((yaw, i) => (
        <ToyWindow
          key={i}
          p={[Math.sin(yaw) * (r + 0.02), h * 0.58, Math.cos(yaw) * (r + 0.02)]}
          rotY={yaw}
          frame={TOY.stone}
        />
      ))}
    </group>
  );
}

/**
 * The Keep — a single proud tower-house: three tapering drums with blush
 * trim, a lantern balcony, a steep periwinkle roof and the tallest
 * pennant on the lineup, ringed by a low courtyard wall.
 */
export function KeepModel() {
  return (
    <group>
      <GrassIsland radius={1.15} />

      {/* Low courtyard wall with the entry gate. */}
      <ToyWall p={[0, T, 0.58]} len={0.9} h={0.3} cap={TOY.slate} merlons={4} />
      <ToyWall p={[0.56, T, 0.22]} rotY={Math.PI / 2.6} len={0.6} h={0.3} cap={TOY.slate} merlons={3} />
      <ToyWall p={[-0.56, T, 0.22]} rotY={-Math.PI / 2.6} len={0.6} h={0.3} cap={TOY.slate} merlons={3} />
      <ToyGate p={[0, T, 0.66]} s={0.9} frame={TOY.stone} />
      <PlankDoor p={[0, T, 0.653]} s={0.9} />
      <Sconce p={[-0.14, T + 0.24, 0.665]} />
      <Sconce p={[0.14, T + 0.24, 0.665]} />
      <Lantern p={[-0.18, T, 0.78]} />
      <Lantern p={[0.18, T, 0.78]} />
      <PathStones p={[0, T, 0.82]} count={2} seed={3} />

      {/* The keep itself: three drums, then the roof. */}
      <Tier y={T} r={0.34} h={0.55} windows={[0.4, 2.4]} />
      <Tier y={T + 0.62} r={0.27} h={0.5} windows={[-0.5, 1.8]} />
      <Tier y={T + 1.19} r={0.21} h={0.42} windows={[0.15]} />
      <StonePatch p={[-0.08, T + 0.24, 0.34]} w={0.3} h={0.26} seed={5} />
      <StonePatch p={[0.1, T + 0.86, 0.27]} w={0.2} h={0.24} seed={12} />
      <ArrowSlit p={[0, T + 1.02, 0.288]} />

      {/* House banner off the first drum, buttresses rooting the base. */}
      <WallBanner p={[-0.17, T + 0.46, 0.31]} rotY={-0.5} s={0.9} />
      <Buttress p={[0.27, T, 0.24]} rotY={0.85} />
      <Buttress p={[-0.27, T, 0.24]} rotY={-0.85} />
      <Ivy p={[0.3, T + 0.1, 0.19]} rotY={1.0} s={0.85} />

      {/* Lantern balcony ring under the roofline, dormer in the roof. */}
      <MerlonRing p={[0, T + 1.66, 0]} radius={0.24} count={9} size={[0.06, 0.06, 0.05]} color={TOY.slate} />
      <ShingleRoof p={[0, T + 1.68, 0]} radius={0.3} h={0.42} color={TOY.steel} trim={TOY.slate} />
      <Dormer p={[0, T + 1.79, 0.17]} s={0.7} roof={TOY.navy} />

      {/* The beacon: an iron cresset blazing at the very top. This is a
          watchtower — the ever-burning signal fire is its whole identity. */}
      <group position={[0, T + 2.04, 0]}>
        <CylT p={[0, 0.05, 0]} rTop={0.016} rBot={0.024} h={0.12} color={TOY.iron} />
        <CylT p={[0, 0.13, 0]} rTop={0.062} rBot={0.032} h={0.07} color={TOY.iron} />
        <mesh position={[0, 0.2, 0]} scale={[1, 1.55, 1]}>
          <sphereGeometry args={[0.055, 14, 12]} />
          <meshStandardMaterial
            color="#4a2c14"
            emissive={TOY.glow}
            emissiveIntensity={2.6}
            roughness={0.5}
          />
        </mesh>
      </group>

      {/* A lean-to annex hugging the base. */}
      <BoxT p={[0.4, T + 0.14, -0.18]} size={[0.34, 0.28, 0.3]} color={TOY.cream} />
      <ShingleRoof p={[0.4, T + 0.28, -0.18]} radius={0.22} h={0.18} color={TOY.slate} tiers={2} />
      <ToyWindow p={[0.4, T + 0.14, -0.028]} s={0.7} frame={TOY.stone} />

      {/* Courtyard well with its little peaked cap. */}
      <group position={[-0.42, T, 0.28]}>
        <CylT p={[0, 0.07, 0]} rTop={0.09} rBot={0.1} h={0.14} color={TOY.stone} />
        <mesh position={[0, 0.141, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.075, 18]} />
          <ToyMat color={TOY.gateDark} />
        </mesh>
        <CylT p={[-0.07, 0.2, 0]} rTop={0.012} rBot={0.012} h={0.16} color={TOY.trunk} />
        <CylT p={[0.07, 0.2, 0]} rTop={0.012} rBot={0.012} h={0.16} color={TOY.trunk} />
        <mesh position={[0, 0.32, 0]}>
          <coneGeometry args={[0.12, 0.09, 16]} />
          <ToyMat color={TOY.slate} />
        </mesh>
      </group>

      {/* Grounds: stores by the annex, pine at the back. */}
      <Barrel p={[0.6, T, 0.04]} />
      <Crate p={[0.56, T, 0.22]} rotY={0.3} s={0.85} />
      <ToyPine p={[-0.78, T, -0.4]} s={0.95} />
      <ToyTree p={[0.82, T, 0.42]} s={0.7} />
      <ToyBush p={[-0.7, T, 0.5]} s={1.1} />
      <ToyBush p={[0.72, T, -0.55]} />
    </group>
  );
}
