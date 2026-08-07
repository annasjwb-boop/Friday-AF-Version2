import { Sparkles } from "@react-three/drei";
import type { StateParams } from "./models/state";

/**
 * Fog and slow environmental particles. Fog is tuned to the slate midtones
 * of the Dusk Grain backdrop so the far edges of each model melt into it.
 */
export function Atmosphere({
  params,
  reducedMotion,
}: {
  params: StateParams;
  reducedMotion: boolean;
}) {
  return (
    <>
      <fog attach="fog" args={["#31363f", 5.5, 11.5]} />
      {!reducedMotion && (
        <>
          <Sparkles
            count={36}
            scale={[5.5, 3.2, 5.5]}
            position={[0, 1.2, 0]}
            size={1.6}
            speed={0.22}
            opacity={0.32}
            color="#e9cfa4"
          />
          {/* Embers drift low when the environment turns threatening */}
          {params.threat > 0.55 && (
            <Sparkles
              count={14}
              scale={[3.2, 1.2, 3.2]}
              position={[0, 0.5, 0]}
              size={2.2}
              speed={0.5}
              opacity={0.5}
              color="#d96536"
            />
          )}
          {/* Fine golden motes accompany recovery */}
          {params.recovering && (
            <Sparkles
              count={20}
              scale={[2.4, 2.2, 2.4]}
              position={[0, 0.9, 0]}
              size={1.8}
              speed={0.35}
              opacity={0.5}
              color="#e8a35c"
            />
          )}
        </>
      )}
    </>
  );
}
