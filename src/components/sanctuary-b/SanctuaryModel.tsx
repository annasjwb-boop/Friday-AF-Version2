import { useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh } from "three";
import type { SanctuaryId } from "../../types/sanctuary";
import type { StateParams } from "./models/state";
import { CoverageDome } from "./models/CoverageDome";
import { HealingCrosses } from "./models/particles";
import { CastleModel } from "./models/CastleModel";
import { CrystalModel } from "./models/CrystalModel";
import { MountainModel } from "./models/MountainModel";
import { IslandModel } from "./models/IslandModel";
import { SkyModel } from "./models/SkyModel";

/**
 * Where the generic props sit on each diorama: the coverage dome's radius
 * and vertical stretch (so it clears each silhouette's apex), and where
 * the healing health points orbit while recovering. The recovery channel
 * is architectural — each model renders its own "way back" rig
 * (drawbridge, boat, carved descent, seed crystals, landing pad) inside
 * its own file.
 */
const KIT: Record<
  SanctuaryId,
  {
    dome: { radius: number; y: number; yScale: number };
    heal: { y: number; radius: number };
  }
> = {
  castle: {
    dome: { radius: 1.78, y: 0.05, yScale: 1.3 },
    heal: { y: 0.5, radius: 1.05 },
  },
  crystal: {
    dome: { radius: 1.6, y: 0.05, yScale: 1.35 },
    heal: { y: 0.5, radius: 0.9 },
  },
  mountain: {
    dome: { radius: 1.72, y: 0.05, yScale: 1.3 },
    heal: { y: 0.6, radius: 1.05 },
  },
  island: {
    dome: { radius: 1.72, y: 0.05, yScale: 1.05 },
    heal: { y: 0.5, radius: 0.95 },
  },
  sky: {
    dome: { radius: 1.45, y: 0.35, yScale: 1.55 },
    heal: { y: 1.05, radius: 1.05 },
  },
};

function ModelSwitch({ id, params }: { id: SanctuaryId; params: StateParams }) {
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

/**
 * Seismic rumble for the quake hazard: short tremor bursts every ~20s
 * shake the physical structure (never the energy dome). Amplitude scales
 * with threat and stays subtle — a shudder, not an explosion.
 */
function TremorGroup({
  active,
  threat,
  children,
}: {
  active: boolean;
  threat: number;
  children: ReactNode;
}) {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    if (!active) {
      g.position.set(0, 0, 0);
      return;
    }
    const t = clock.getElapsedTime();
    const burst = Math.pow(Math.max(0, Math.sin(t * 0.32)), 8);
    const amp = threat * 0.014 * burst;
    g.position.x = Math.sin(t * 47) * amp;
    g.position.z = Math.cos(t * 53) * amp * 0.7;
    g.position.y = Math.abs(Math.sin(t * 61)) * amp * 0.5;
  });
  return <group ref={ref}>{children}</group>;
}

/**
 * Floodwater rising around the plinth: a broad reflective sheet whose
 * level climbs with threat — at high threat it swallows the plinth steps
 * and laps just below the platform — with a slow swell so it reads as
 * water, not a disc.
 */
function FloodWater({ threat }: { threat: number }) {
  const ref = useRef<Mesh>(null);
  const level = 0.05 + threat * 0.32;
  // Rising water spreads as well as rises: low threat hugs the diorama's
  // base as a waterline, high threat swallows the surrounding ground.
  const reach = 1.7 + threat * 0.9;
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.position.y =
      level + Math.sin(t * 0.6) * 0.014 + Math.sin(t * 1.7) * 0.006;
  });
  return (
    <mesh ref={ref} position={[0, level, 0]}>
      <cylinderGeometry args={[reach, reach, 0.05, 64]} />
      <meshStandardMaterial
        color="#3d4f5c"
        transparent
        opacity={0.35 + threat * 0.45}
        roughness={0.12}
        metalness={0.15}
      />
    </mesh>
  );
}

/**
 * Renders the procedural placeholder for a sanctuary. In the personalized
 * (risk) view the channel props join the archetype: the coverage dome and
 * hazard effects here, the recovery rig inside each model file (so the way
 * back is expressed in the model's own architecture). Each group carries
 * an `anchor` tag so "Why it looks this way" can highlight one region and
 * dim the rest. Swapping the archetypes for GLB/GLTF assets later only
 * requires changing the dispatch — the surrounding scene, camera, and UI
 * stay untouched.
 */
export function SanctuaryModel({
  id,
  params,
}: {
  id: SanctuaryId;
  params: StateParams;
}) {
  const kit = KIT[id];
  const quaking =
    params.personalized && params.hazard === "quake" && params.threat > 0.3;
  return (
    <group>
      <TremorGroup active={quaking} threat={params.threat}>
        <group userData={{ anchor: "structure" }}>
          <ModelSwitch id={id} params={params} />
        </group>
      </TremorGroup>
      {params.recovering && (
        <HealingCrosses
          p={[0, kit.heal.y, 0]}
          radius={kit.heal.radius}
          height={1.15}
        />
      )}
      {params.personalized && (
        <>
          {params.boundary !== null && (
            <group userData={{ anchor: "boundary" }}>
              <CoverageDome
                radius={kit.dome.radius}
                y={kit.dome.y}
                yScale={kit.dome.yScale}
                covered={params.boundary}
                accent={params.accent}
              />
            </group>
          )}
          {params.hazard === "flood" && params.threat > 0.15 && (
            <group userData={{ anchor: "environment" }}>
              <FloodWater threat={params.threat} />
            </group>
          )}
        </>
      )}
    </group>
  );
}
