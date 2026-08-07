import { useMemo } from "react";
import type { RiskState, SanctuaryId } from "../../types/sanctuary";
import { stateParams } from "./models/state";
import { CastleModel } from "./models/CastleModel";
import { CrystalModel } from "./models/CrystalModel";
import { MountainModel } from "./models/MountainModel";
import { IslandModel } from "./models/IslandModel";
import { SkyModel } from "./models/SkyModel";

/**
 * Renders the procedural placeholder for a sanctuary in a given risk state.
 * Swapping these for GLB/GLTF assets later only requires changing this
 * dispatch — the surrounding scene, camera, and UI stay untouched.
 */
export function SanctuaryModel({
  id,
  state,
}: {
  id: SanctuaryId;
  state: RiskState;
}) {
  const params = useMemo(() => stateParams(state), [state]);
  switch (id) {
    case "crystal":
      return <CrystalModel params={params} />;
    case "mountain":
      return <MountainModel params={params} />;
    case "island":
      return <IslandModel params={params} />;
    case "sky":
      return <SkyModel params={params} />;
    default:
      return <CastleModel params={params} />;
  }
}
