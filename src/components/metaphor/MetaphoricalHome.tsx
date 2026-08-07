import { Suspense, useCallback, useState } from "react";
import { Canvas, type RootState } from "@react-three/fiber";
import { HomeStateProvider } from "./state";
import { MaterialsProvider } from "./materials";
import { SceneRig } from "./SceneRig";
import { HomeModel } from "./HomeModel";
import { DEFAULT_HOME_STATE, type HomeStateParams, type MetaphorType } from "./types";
import "./MetaphoricalHome.css";

export type MetaphoricalHomeProps = Partial<HomeStateParams> & {
  type: MetaphorType;
  className?: string;
};

/**
 * Reusable metaphorical-home render: shared studio lighting, materials, and
 * a fully dimensional orbit camera (drag to rotate, pinch/scroll to zoom,
 * two-finger / right-drag to pan). State parameters ease without swapping
 * the model.
 */
export function MetaphoricalHome({
  type,
  className,
  structuralIntegrity = DEFAULT_HOME_STATE.structuralIntegrity,
  preparedness = DEFAULT_HOME_STATE.preparedness,
  activeRisk = DEFAULT_HOME_STATE.activeRisk,
  recoveryProgress = DEFAULT_HOME_STATE.recoveryProgress,
  coverageStrength = DEFAULT_HOME_STATE.coverageStrength,
}: MetaphoricalHomeProps) {
  const state: HomeStateParams = {
    structuralIntegrity,
    preparedness,
    activeRisk,
    recoveryProgress,
    coverageStrength,
  };

  // If the GPU drops the WebGL context (tab pressure, driver hiccup), remount
  // the canvas on a fresh context instead of leaving a dead black stage.
  const [contextGeneration, setContextGeneration] = useState(0);
  const handleCreated = useCallback(({ gl }: RootState) => {
    gl.domElement.addEventListener(
      "webglcontextlost",
      (event) => {
        event.preventDefault();
        setTimeout(() => setContextGeneration((n) => n + 1), 400);
      },
      { once: true },
    );
  }, []);

  return (
    <div className={`metaphor-home${className ? ` ${className}` : ""}`}>
      <Canvas
        key={contextGeneration}
        onCreated={handleCreated}
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        // Perspective so orbiting reads as a real dimensional object.
        camera={{
          fov: 32,
          position: [4.2, 3.1, 5.8],
          near: 0.1,
          far: 60,
        }}
      >
        <Suspense fallback={null}>
          <HomeStateProvider target={state}>
            <MaterialsProvider>
              <SceneRig>
                <HomeModel type={type} />
              </SceneRig>
            </MaterialsProvider>
          </HomeStateProvider>
        </Suspense>
      </Canvas>
    </div>
  );
}
