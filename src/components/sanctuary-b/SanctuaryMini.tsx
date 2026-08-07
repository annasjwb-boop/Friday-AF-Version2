import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import type { Group } from "three";
import { getSanctuary } from "../../data/sanctuaries-b";
import { sanctuaryProfile } from "../../data/sanctuary-profile";
import { useBackground } from "../../app/background";
import { useSanctuaryStory } from "../../app/sanctuaryStory";
import { profileParams, stateParams } from "./models/state";
import { getSanctuaryTheme, themedParams } from "./themes";
import { SanctuaryModel } from "./SanctuaryModel";

/** Frame the model like an icon: the whole silhouette (clouds included)
    fits inside the canvas with air around it, like a glyph in a button. */
function MiniCamera({ framing }: { framing: number }) {
  const { camera } = useThree();
  useEffect(() => {
    const dist = 7 * framing;
    const elevation = 0.36;
    camera.position.set(0, 0.78 + Math.sin(elevation) * dist, Math.cos(elevation) * dist);
    camera.lookAt(0, 0.72, 0);
  }, [camera, framing]);
  return null;
}

/** Slow idle rotation so the avatar reads as a living miniature. */
function SpinGroup({
  yaw,
  reducedMotion,
  children,
}: {
  yaw: number;
  reducedMotion: boolean;
  children: React.ReactNode;
}) {
  const group = useRef<Group>(null);
  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    if (reducedMotion) {
      g.rotation.y = yaw;
    } else {
      g.rotation.y += dt * 0.12;
    }
  });
  return (
    <group ref={group} rotation={[0, yaw, 0]}>
      {children}
    </group>
  );
}

/**
 * The living miniature inside the header avatar: the user's committed
 * sanctuary model on a tiny transparent canvas — always the bare object.
 * By default it renders the clean structure alone; the appearance sheet
 * can switch on the full personalized condition (weathering, hazard
 * effects on the model), but never the dome or any containing shell,
 * which would swallow the model at 44px. No shadows or atmosphere — the
 * silhouette is what reads.
 */
export default function SanctuaryMini() {
  const { sanctuaryId, avatarDetail } = useSanctuaryStory();
  const { sanctuaryTheme } = useBackground();
  const reducedMotion = useReducedMotion() ?? false;

  const theme = getSanctuaryTheme(sanctuaryTheme);
  const sanctuary = getSanctuary(sanctuaryId);
  const params = useMemo(() => {
    const base =
      avatarDetail === "full"
        ? { ...profileParams(sanctuaryProfile), boundary: null }
        : stateParams("healthy");
    return themedParams(base, theme);
  }, [theme, avatarDetail]);

  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      camera={{ fov: 34, position: [0, 2.4, 6.4], near: 0.1, far: 30 }}
      style={{ background: "transparent" }}
    >
      <Suspense fallback={null}>
        <MiniCamera framing={sanctuary.framing} />
        <hemisphereLight
          color={theme.scene.hemi}
          groundColor={theme.scene.hemiGround}
          intensity={1.05}
        />
        <directionalLight
          color={theme.scene.key}
          position={[3.4, 5.6, 3.2]}
          intensity={2.2}
        />
        <directionalLight
          color={theme.scene.rim}
          position={[-2.8, 3, -3.6]}
          intensity={0.9}
        />
        <SpinGroup yaw={sanctuary.heroYaw} reducedMotion={reducedMotion}>
          <SanctuaryModel id={sanctuary.id} params={params} />
        </SpinGroup>
      </Suspense>
    </Canvas>
  );
}
