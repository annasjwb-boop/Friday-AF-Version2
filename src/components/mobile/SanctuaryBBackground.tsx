import { useBackground } from "../../app/background";
import { getSanctuaryTheme } from "../sanctuary-b/themes";
import { MeshGradientCanvas } from "./MeshGradientCanvas";
import "./SanctuaryBBackground.css";

/**
 * "Sanctuary" full-frame backdrop: the mesh-gradient shader painted with
 * the selected environment theme, over a flat theme fill for the no-WebGL
 * fallback.
 */
export function SanctuaryBBackground() {
  const { sanctuaryTheme } = useBackground();
  const theme = getSanctuaryTheme(sanctuaryTheme);

  return (
    <div
      className="sanctuary-b-bg"
      style={{ background: theme.base }}
      aria-hidden="true"
    >
      <MeshGradientCanvas
        mesh={theme.mesh}
        deep={theme.meshDeep}
        className="sanctuary-b-bg__canvas"
      />
    </div>
  );
}
