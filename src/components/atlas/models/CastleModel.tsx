import {
  ArrowSlit,
  Barrel,
  BoxT,
  BrickCourses,
  Buttress,
  Crate,
  Dormer,
  GrassIsland,
  ISLAND_TOP,
  Ivy,
  Lantern,
  MerlonRow,
  PathStones,
  Pennant,
  PlankDoor,
  Sconce,
  ShingleRoof,
  Sprinkles,
  StonePatch,
  ToyBush,
  ToyGate,
  ToyPine,
  ToyRock,
  ToyTower,
  ToyTree,
  ToyWall,
  ToyWindow,
  WallBanner,
  TOY,
} from "./shared";

const T = ISLAND_TOP;

/** Squashed coil roof for the great hall — same clay rings as the towers. */
function HallRoof({
  p,
  w,
  d,
  h,
  color,
}: {
  p: [number, number, number];
  w: number;
  d: number;
  h: number;
  color: string;
}) {
  return (
    <group position={p} scale={[w / 0.5, h / 0.42, d / 0.5]}>
      <ShingleRoof p={[0, 0, 0]} radius={0.5} h={0.42} color={color} tiers={3} />
    </group>
  );
}

/**
 * The Castle — the pastel storybook archetype: square curtain walls with
 * lilac crenellation, a framed gate, four periwinkle-roofed towers and a
 * great hall rising behind, greenery tucked around the corners.
 */
export function CastleModel() {
  return (
    <group>
      <GrassIsland radius={1.3} />

      {/* Curtain walls with lilac cap courses. */}
      <ToyWall p={[-0.36, T, 0.62]} len={0.62} cap={TOY.slate} merlons={3} />
      <ToyWall p={[0.36, T, 0.62]} len={0.62} cap={TOY.slate} merlons={3} />
      <ToyWall p={[0, T, -0.62]} len={1.34} cap={TOY.slate} merlons={6} />
      <ToyWall p={[0.62, T, 0]} rotY={Math.PI / 2} len={1.14} cap={TOY.slate} merlons={5} />
      <ToyWall p={[-0.62, T, 0]} rotY={Math.PI / 2} len={1.14} cap={TOY.slate} merlons={5} />

      {/* Gatehouse: blush stone arch, plank door, lit window, pennant. */}
      <BoxT p={[0, T + 0.34, 0.62]} size={[0.5, 0.68, 0.22]} color={TOY.cream} />
      <MerlonRow p={[0, T + 0.72, 0.62]} len={0.5} count={3} color={TOY.slate} />
      <ToyGate p={[0, T, 0.735]} s={1.05} frame={TOY.rust} />
      <PlankDoor p={[0, T, 0.727]} s={1.05} />
      <ToyWindow p={[0, T + 0.52, 0.735]} s={0.9} frame={TOY.rust} />
      <Pennant p={[0, T + 0.76, 0.62]} h={0.2} color={TOY.rust} />
      {/* Masonry patches and carved courses either side of the arch. */}
      <StonePatch p={[-0.14, T + 0.3, 0.732]} w={0.16} h={0.4} seed={4} />
      <StonePatch p={[0.15, T + 0.34, 0.732]} w={0.14} h={0.44} seed={11} />
      <BrickCourses p={[0, T + 0.56, 0.732]} w={0.46} h={0.2} seed={9} />

      {/* Torch sconces on the gatehouse, braziers at the path, stores
          stacked against the wall. */}
      <Sconce p={[-0.17, T + 0.33, 0.735]} />
      <Sconce p={[0.17, T + 0.33, 0.735]} />
      <Lantern p={[-0.2, T, 0.84]} />
      <Lantern p={[0.2, T, 0.84]} />
      <PathStones p={[0, T, 0.92]} count={3} seed={2} />
      <Barrel p={[0.38, T, 0.86]} />
      <Barrel p={[0.47, T, 0.78]} s={0.8} />
      <Crate p={[-0.42, T, 0.88]} rotY={0.4} s={0.9} />

      {/* Oxblood banners draped over the front walls. */}
      <WallBanner p={[-0.25, T + 0.5, 0.705]} s={0.9} />
      <WallBanner p={[0.25, T + 0.5, 0.705]} s={0.9} />

      {/* Front corner towers — short, candle-snuffer roofs. */}
      <ToyTower p={[-0.66, T, 0.66]} rBody={0.15} h={0.5} roof={TOY.steel} windows={1} windowYaw={0.6} />
      <ToyTower p={[0.66, T, 0.66]} rBody={0.15} h={0.5} roof={TOY.steel} windows={1} windowYaw={-0.6} />

      {/* Back towers — taller, one carrying the banner and a dormer. */}
      <ToyTower p={[-0.62, T, -0.62]} rBody={0.16} h={0.85} roof={TOY.navy} windows={2} windowYaw={0.5} />
      <ToyTower
        p={[0.58, T, -0.5]}
        rBody={0.18}
        h={1.15}
        roof={TOY.steel}
        roofH={0.42}
        flag
        windows={2}
        windowYaw={-0.4}
      />
      <Dormer p={[0.58, T + 1.32, -0.36]} s={0.75} roof={TOY.navy} />

      {/* The great hall: gabled block with a blue coil roof and chimney. */}
      <BoxT p={[-0.08, T + 0.4, -0.14]} size={[0.74, 0.8, 0.56]} color={TOY.cream} />
      <HallRoof p={[-0.08, T + 1.0, -0.14]} w={0.62} d={0.5} h={0.42} color={TOY.steel} />
      <BoxT p={[0.14, T + 1.12, -0.28]} size={[0.09, 0.26, 0.09]} color={TOY.cream} />
      <BoxT p={[0.14, T + 1.26, -0.28]} size={[0.12, 0.035, 0.12]} color={TOY.creamShade} />
      <ToyWindow p={[-0.2, T + 0.62, 0.145]} s={1} frame={TOY.rust} />
      <ToyWindow p={[0.08, T + 0.5, 0.145]} s={0.85} frame={TOY.rust} />
      <ToyWindow p={[-0.45, T + 0.55, -0.14]} rotY={-Math.PI / 2} s={0.85} frame={TOY.rust} />
      <StonePatch p={[-0.24, T + 0.28, 0.145]} w={0.4} h={0.3} seed={7} />
      <StonePatch p={[-0.455, T + 0.34, -0.02]} rotY={-Math.PI / 2} w={0.3} h={0.4} seed={13} />
      <BrickCourses p={[-0.08, T + 0.26, 0.15]} w={0.68} h={0.3} seed={21} />

      {/* Tudor timber framing across the hall's upper story. */}
      <BoxT p={[-0.08, T + 0.77, 0.15]} size={[0.74, 0.03, 0.016]} color={TOY.timber} />
      <BoxT p={[-0.42, T + 0.6, 0.15]} size={[0.03, 0.37, 0.016]} color={TOY.timber} />
      <BoxT p={[-0.02, T + 0.66, 0.15]} size={[0.03, 0.25, 0.016]} color={TOY.timber} />
      <BoxT p={[0.25, T + 0.6, 0.15]} size={[0.03, 0.37, 0.016]} color={TOY.timber} />
      <BoxT p={[0.12, T + 0.68, 0.15]} r={[0, 0, 0.65]} size={[0.03, 0.2, 0.015]} color={TOY.timber} />

      {/* Buttresses shouldering the hall, ivy climbing the walls. */}
      <Buttress p={[-0.38, T, 0.17]} />
      <Buttress p={[0.22, T, 0.17]} />
      <Ivy p={[-0.52, T + 0.1, 0.71]} s={0.9} />
      <Ivy p={[0.42, T + 0.12, -0.7]} rotY={Math.PI} s={1.1} />

      {/* A slim stair tower snugged against the hall. */}
      <ToyTower p={[0.42, T, -0.02]} rBody={0.12} h={0.95} roof={TOY.slate} roofH={0.3} windows={1} windowYaw={0.9} />

      {/* Arrow slits watching the approach. */}
      <ArrowSlit p={[-0.36, T + 0.26, 0.705]} />
      <ArrowSlit p={[0.36, T + 0.26, 0.705]} />

      {/* Greenery and dressing — oaks and pines, not lollipops. */}
      <ToyTree p={[-1.0, T, 0.42]} s={1} />
      <ToyPine p={[1.02, T, -0.3]} s={1.05} />
      <ToyPine p={[-1.02, T, -0.48]} s={0.85} />
      <ToyBush p={[-0.92, T, 0.78]} />
      <ToyBush p={[0.95, T, 0.62]} s={1.2} color={TOY.leaf} />
      <ToyRock p={[-0.85, T + 0.03, 0.6]} s={0.8} color={TOY.stone} />
      <ToyRock p={[0.88, T + 0.03, 0.42]} s={0.6} color={TOY.stone} />
      <Sprinkles p={[0, T + 0.01, 0]} radius={1.05} seed={3} count={14} />
    </group>
  );
}
