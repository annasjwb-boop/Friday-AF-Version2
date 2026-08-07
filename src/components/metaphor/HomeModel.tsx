import type { MetaphorType } from "./types";
import { SanctuaryHome } from "./homes/SanctuaryHome";
import { CastleHome } from "./homes/CastleHome";
import { CabinHome } from "./homes/CabinHome";
import { GreenhouseHome } from "./homes/GreenhouseHome";
import { LighthouseHome } from "./homes/LighthouseHome";
import { BunkerHome } from "./homes/BunkerHome";
import { TreehouseHome } from "./homes/TreehouseHome";
import { MountainHome } from "./homes/MountainHome";
import { SkyHome } from "./homes/SkyHome";
import { SolitudeHome } from "./homes/SolitudeHome";

const HOMES: Record<MetaphorType, () => React.JSX.Element> = {
  sanctuary: SanctuaryHome,
  castle: CastleHome,
  cabin: CabinHome,
  greenhouse: GreenhouseHome,
  lighthouse: LighthouseHome,
  bunker: BunkerHome,
  treehouse: TreehouseHome,
  mountain: MountainHome,
  sky: SkyHome,
  solitude: SolitudeHome,
};

/** Swaps the central metaphor without touching the shared visual system. */
export function HomeModel({ type }: { type: MetaphorType }) {
  const Home = HOMES[type];
  return <Home />;
}
