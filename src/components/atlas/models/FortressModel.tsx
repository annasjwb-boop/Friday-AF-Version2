import {
  ArrowSlit,
  Barrel,
  BoxT,
  BrickCourses,
  Buttress,
  Crate,
  CylT,
  Dormer,
  GrassIsland,
  ISLAND_TOP,
  Ivy,
  Lantern,
  MerlonRing,
  MerlonRow,
  PathStones,
  PlankDoor,
  Sconce,
  StonePatch,
  ToyBush,
  ToyGate,
  ToyPine,
  ToyRock,
  ToyTower,
  ToyTree,
  ToyWindow,
  WallBanner,
  TOY,
} from "./shared";

const T = ISLAND_TOP;

/**
 * The Fortress — the stout gatehouse citadel from the game-art reference:
 * two fat drum towers hugging a grand arch, teal shingle roofs with gold
 * eaves, a tall watch tower behind, autumn trees at its feet.
 */
export function FortressModel() {
  return (
    <group>
      <GrassIsland radius={1.3} grass="#93b83c" />

      {/* Grand gatehouse: drum towers flanking the arch. */}
      <CylT p={[-0.34, T + 0.34, 0.52]} rTop={0.2} rBot={0.24} h={0.68} color={TOY.cream} seg={20} />
      <CylT p={[0.34, T + 0.34, 0.52]} rTop={0.2} rBot={0.24} h={0.68} color={TOY.cream} seg={20} />
      <CylT p={[-0.34, T + 0.71, 0.52]} rTop={0.25} rBot={0.25} h={0.07} color={TOY.creamShade} seg={20} />
      <CylT p={[0.34, T + 0.71, 0.52]} rTop={0.25} rBot={0.25} h={0.07} color={TOY.creamShade} seg={20} />
      <MerlonRing p={[-0.34, T + 0.79, 0.52]} radius={0.2} count={8} color={TOY.creamShade} />
      <MerlonRing p={[0.34, T + 0.79, 0.52]} radius={0.2} count={8} color={TOY.creamShade} />
      <ToyWindow p={[-0.34, T + 0.5, 0.755]} s={0.9} frame={TOY.creamShade} />
      <ToyWindow p={[0.34, T + 0.5, 0.755]} s={0.9} frame={TOY.creamShade} />
      <ArrowSlit p={[-0.34, T + 0.24, 0.757]} />
      <ArrowSlit p={[0.34, T + 0.24, 0.757]} />

      {/* The gate wall between them, banner above the arch. */}
      <BoxT p={[0, T + 0.29, 0.5]} size={[0.5, 0.58, 0.24]} color={TOY.cream} />
      <BoxT p={[0, T + 0.61, 0.5]} size={[0.56, 0.08, 0.3]} color={TOY.creamShade} />
      <MerlonRow p={[0, T + 0.69, 0.5]} len={0.56} count={3} color={TOY.creamShade} />
      <ToyGate p={[0, T, 0.625]} s={1.25} frame={TOY.stone} />
      <PlankDoor p={[0, T, 0.617]} s={1.25} />
      {/* Timber lintel and the garrison crest over the gate. */}
      <BoxT p={[0, T + 0.56, 0.632]} size={[0.42, 0.035, 0.024]} color={TOY.timber} />
      <BoxT p={[0, T + 0.47, 0.63]} size={[0.16, 0.11, 0.02]} color={TOY.gold} />
      <BoxT p={[0, T + 0.4, 0.635]} size={[0.08, 0.08, 0.015]} color={TOY.rust} />
      <Sconce p={[-0.21, T + 0.32, 0.632]} />
      <Sconce p={[0.21, T + 0.32, 0.632]} />

      {/* Approach dressing: braziers, flagstones, stores by the wall. */}
      <Lantern p={[-0.26, T, 0.84]} />
      <Lantern p={[0.26, T, 0.84]} />
      <PathStones p={[0, T, 0.92]} count={3} seed={5} />
      <Barrel p={[0.56, T, 0.6]} />
      <Barrel p={[0.64, T, 0.5]} s={0.8} />
      <Crate p={[-0.55, T, 0.64]} rotY={0.5} s={0.9} />

      {/* Banners on the outer curtain walls, ivy at the drum's foot. */}
      <WallBanner p={[0.705, T + 0.44, 0.18]} rotY={Math.PI / 2} s={0.9} />
      <WallBanner p={[-0.705, T + 0.44, 0.18]} rotY={-Math.PI / 2} s={0.9} />
      <Ivy p={[-0.34, T + 0.12, 0.745]} s={0.75} />

      {/* Side curtain walls running back from the gatehouse. */}
      <BoxT p={[-0.62, T + 0.22, -0.05]} size={[0.16, 0.44, 0.95]} color={TOY.cream} />
      <BoxT p={[0.62, T + 0.22, -0.05]} size={[0.16, 0.44, 0.95]} color={TOY.cream} />
      <MerlonRow p={[-0.62, T + 0.5, -0.05]} rotY={Math.PI / 2} len={0.95} count={4} color={TOY.creamShade} />
      <MerlonRow p={[0.62, T + 0.5, -0.05]} rotY={Math.PI / 2} len={0.95} count={4} color={TOY.creamShade} />

      {/* Inner keep block with its teal-roofed towers. */}
      <BoxT p={[0, T + 0.42, -0.3]} size={[0.8, 0.84, 0.6]} color={TOY.cream} />
      <ToyWindow p={[-0.18, T + 0.66, 0.005]} s={0.95} frame={TOY.creamShade} />
      <ToyWindow p={[0.14, T + 0.52, 0.005]} s={0.8} frame={TOY.creamShade} />
      <StonePatch p={[0.28, T + 0.28, 0.005]} w={0.24} h={0.34} seed={6} />
      <StonePatch p={[-0.3, T + 0.32, 0.005]} w={0.18} h={0.4} seed={17} />
      <BrickCourses p={[0, T + 0.7, 0.005]} w={0.74} h={0.22} seed={14} />
      <BrickCourses p={[0, T + 0.2, 0.622]} w={0.44} h={0.22} seed={19} />
      <Buttress p={[-0.34, T, 0.02]} h={0.4} />
      <Buttress p={[0.34, T, 0.02]} h={0.4} />
      {/* Chimney off the keep roofline. */}
      <BoxT p={[0.26, T + 0.92, -0.44]} size={[0.08, 0.22, 0.08]} color={TOY.cream} />
      <BoxT p={[0.26, T + 1.04, -0.44]} size={[0.11, 0.03, 0.11]} color={TOY.creamShade} />
      <ToyTower
        p={[-0.42, T, -0.62]}
        rBody={0.17}
        h={0.95}
        roof={TOY.teal}
        trim={TOY.gold}
        roofH={0.38}
        windows={1}
        windowYaw={0.5}
      />
      <ToyTower
        p={[0.42, T, -0.62]}
        rBody={0.17}
        h={0.95}
        roof={TOY.teal}
        trim={TOY.gold}
        roofH={0.38}
        windows={1}
        windowYaw={-0.5}
      />
      {/* Central watch tower, tallest, flying the pennant. */}
      <ToyTower
        p={[0, T, -0.28]}
        rBody={0.2}
        h={1.3}
        roof={TOY.tealDeep}
        trim={TOY.gold}
        roofH={0.46}
        flag
        flagColor={TOY.gold}
        windows={2}
        windowYaw={0.2}
      />
      <Dormer p={[0, T + 1.47, -0.12]} s={0.75} roof={TOY.tealDeep} />

      {/* Autumn dressing: rust oaks and dark pines. */}
      <ToyTree p={[-1.0, T, 0.35]} s={1.05} color={TOY.leafOrange} />
      <ToyTree p={[1.02, T, 0.15]} s={0.85} color={TOY.leafOrange} />
      <ToyPine p={[0.85, T, -0.75]} s={1} />
      <ToyPine p={[-0.95, T, -0.6]} s={0.8} />
      <ToyBush p={[-0.85, T, 0.72]} color={TOY.leafOrange} />
      <ToyBush p={[0.68, T, 0.72]} s={1.1} />
      <ToyRock p={[-0.72, T + 0.03, 0.85]} s={0.9} color={TOY.stone} />
      <ToyRock p={[1.05, T + 0.03, -0.35]} s={0.7} color={TOY.stone} />
    </group>
  );
}
