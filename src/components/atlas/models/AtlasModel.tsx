import { CastleModel } from "./CastleModel";
import { CitadelModel } from "./CitadelModel";
import { FortressModel } from "./FortressModel";
import { KeepModel } from "./KeepModel";
import { MountainModel } from "./MountainModel";
import { SkyModel } from "./SkyModel";

export type AtlasModelId =
  | "castle"
  | "citadel"
  | "fortress"
  | "keep"
  | "mountain"
  | "sky";

export type AtlasModelMeta = {
  id: AtlasModelId;
  /** Picker chip label. */
  label: string;
  /** Short poster line for the callout. */
  descriptor: string;
};

/** The atlas lineup: all homes, all castles — no abstractions. */
export const ATLAS_MODELS: AtlasModelMeta[] = [
  { id: "citadel", label: "Citadel", descriptor: "Sculpted and sovereign" },
  { id: "castle", label: "Castle", descriptor: "Proud and enduring" },
  { id: "fortress", label: "Fortress", descriptor: "Stout and watchful" },
  { id: "keep", label: "Keep", descriptor: "Tall and steadfast" },
  { id: "mountain", label: "Mountain", descriptor: "Grounded and immovable" },
  { id: "sky", label: "Sky", descriptor: "Elevated and visionary" },
];

export function AtlasModel({ id }: { id: AtlasModelId }) {
  switch (id) {
    case "citadel":
      return <CitadelModel />;
    case "fortress":
      return <FortressModel />;
    case "keep":
      return <KeepModel />;
    case "mountain":
      return <MountainModel />;
    case "sky":
      return <SkyModel />;
    default:
      return <CastleModel />;
  }
}
