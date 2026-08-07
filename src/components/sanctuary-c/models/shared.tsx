import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CanvasTexture,
  RepeatWrapping,
  type MeshStandardMaterial,
} from "three";

type Vec3 = [number, number, number];

/**
 * Polestar body palette: the models read as studio-lit vehicle bodywork —
 * porcelain white and silver panels over graphite recesses, no warmth in
 * the neutrals. Signature orange stays the single accent.
 */
export const CLAY = {
  cream: "#eaeaec",
  bone: "#cfcfd3",
  dim: "#a3a3a8",
  deep: "#232327",
  cool: "#d6dade",
  coolDim: "#a4aab0",
  water: "#5c646c",
  strut: "#98989c",
  crack: "#141417",
};

/** Height of the plinth's top platform — dioramas build up from here. */
export const PLINTH_TOP = 0.42;

/** Fine speckle bump so surfaces read as matte clay rather than plastic. */
let grainTexture: CanvasTexture | null = null;

function getGrainTexture(): CanvasTexture {
  if (grainTexture) return grainTexture;
  // 2px speckles at higher resolution: enough tooth to read as clay without
  // the single-pixel noise that shimmered ("jittered") during rotation.
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 5000; i++) {
    const v = 104 + Math.floor(Math.random() * 48);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
  }
  grainTexture = new CanvasTexture(canvas);
  grainTexture.wrapS = RepeatWrapping;
  grainTexture.wrapT = RepeatWrapping;
  grainTexture.repeat.set(4, 4);
  return grainTexture;
}

/**
 * Weathering overlays: blotchy stains and rain streaks whose density grows
 * with wear, multiplied over the clay color so surfaces read as roughened
 * and patinated rather than marked with drawn-on crack lines. Cached per
 * intensity bucket so materials share textures.
 */
const wearTextures = new Map<number, CanvasTexture>();

function getWearTexture(bucket: number): CanvasTexture {
  const cached = wearTextures.get(bucket);
  if (cached) return cached;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  // Soft blotches of grime and discoloration.
  const blotches = 8 + bucket * 14;
  for (let i = 0; i < blotches; i++) {
    ctx.fillStyle = `rgba(58, 58, 64, ${0.05 + Math.random() * 0.045 * bucket})`;
    ctx.beginPath();
    ctx.ellipse(
      Math.random() * size,
      Math.random() * size,
      8 + Math.random() * 30,
      6 + Math.random() * 22,
      Math.random() * Math.PI,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  // Vertical weather streaks, like rain-carried grime.
  const streaks = 5 + bucket * 7;
  for (let i = 0; i < streaks; i++) {
    ctx.fillStyle = `rgba(62, 62, 68, ${0.03 + 0.025 * bucket})`;
    ctx.fillRect(
      Math.random() * size,
      Math.random() * size * 0.6,
      2 + Math.random() * 3,
      26 + Math.random() * 80,
    );
  }
  // Chipped-edge speckling at the heavier buckets.
  if (bucket >= 3) {
    for (let i = 0; i < 120; i++) {
      ctx.fillStyle = `rgba(54, 54, 60, ${0.08 + Math.random() * 0.1})`;
      ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(2, 2);
  wearTextures.set(bucket, texture);
  return texture;
}

/** The one material: matte porcelain clay, weathering with `wear`. */
export function ClayMat({
  color = CLAY.cream,
  rough = 0.92,
  flat = false,
  wear = 0,
}: {
  color?: string;
  rough?: number;
  flat?: boolean;
  /** 0..1 surface weathering: stains, streaks, and a rougher bump. */
  wear?: number;
}) {
  const grain = useMemo(getGrainTexture, []);
  const bucket =
    wear > 0.08 ? Math.min(4, Math.max(1, Math.ceil(wear * 4))) : 0;
  const stains = useMemo(
    () => (bucket ? getWearTexture(bucket) : null),
    [bucket],
  );
  return (
    <meshStandardMaterial
      color={color}
      roughness={Math.min(1, rough + wear * 0.08)}
      metalness={0}
      flatShading={flat}
      map={stains ?? undefined}
      bumpMap={grain}
      bumpScale={0.12 + wear * 0.34}
    />
  );
}

/** Generic clay box. */
export function BoxP({
  p,
  r,
  size,
  color = CLAY.cream,
  wear = 0,
}: {
  p?: Vec3;
  r?: Vec3;
  size: Vec3;
  color?: string;
  wear?: number;
}) {
  return (
    <mesh position={p} rotation={r} castShadow receiveShadow>
      <boxGeometry args={size} />
      <ClayMat color={color} wear={wear} />
    </mesh>
  );
}

/** Generic clay cylinder (tower body, plinth step, trunk, terrace). */
export function Cyl({
  p,
  r,
  rTop,
  rBot,
  h,
  color = CLAY.cream,
  flat = false,
  seg = 32,
  wear = 0,
}: {
  p?: Vec3;
  r?: Vec3;
  rTop: number;
  rBot: number;
  h: number;
  color?: string;
  flat?: boolean;
  seg?: number;
  wear?: number;
}) {
  return (
    <mesh position={p} rotation={r} castShadow receiveShadow>
      <cylinderGeometry args={[rTop, rBot, h, seg]} />
      <ClayMat color={color} flat={flat} wear={wear} />
    </mesh>
  );
}

/** Faceted shard / peak: a low-segment cone with flat shading. */
export function Shard({
  p,
  r,
  radius,
  h,
  color = CLAY.cream,
  sides = 5,
  wear = 0,
}: {
  p?: Vec3;
  r?: Vec3;
  radius: number;
  h: number;
  color?: string;
  sides?: number;
  wear?: number;
}) {
  return (
    <mesh position={p} rotation={r} castShadow receiveShadow>
      <coneGeometry args={[radius, h, sides]} />
      <ClayMat color={color} flat wear={wear} />
    </mesh>
  );
}

/**
 * The circular stepped display base from the reference. Three shallow steps
 * rising to a platform whose surface sits at PLINTH_TOP.
 */
export function Plinth({
  radius = 1.3,
  color = CLAY.cream,
  topColor,
}: {
  radius?: number;
  color?: string;
  topColor?: string;
}) {
  // Each step sinks slightly into the one below it: exactly flush faces
  // z-fight and shimmer as the camera moves.
  return (
    <group>
      <Cyl p={[0, 0.05, 0]} rTop={radius * 1.24} rBot={radius * 1.24} h={0.1} color={color} />
      <Cyl p={[0, 0.14, 0]} rTop={radius * 1.12} rBot={radius * 1.12} h={0.1} color={color} />
      <Cyl p={[0, 0.23, 0]} rTop={radius * 1.02} rBot={radius * 1.02} h={0.1} color={color} />
      <Cyl
        p={[0, 0.345, 0]}
        rTop={radius}
        rBot={radius}
        h={0.15}
        color={topColor ?? color}
      />
    </group>
  );
}

/** Ring of small merlon blocks around a tower rim or along a wall. */
export function Crenels({
  p,
  radius,
  count,
  size = [0.09, 0.09, 0.06],
  color = CLAY.cream,
}: {
  p: Vec3;
  radius: number;
  count: number;
  size?: Vec3;
  color?: string;
}) {
  const blocks = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    blocks.push(
      <BoxP
        key={i}
        p={[p[0] + Math.cos(a) * radius, p[1], p[2] + Math.sin(a) * radius]}
        r={[0, -a, 0]}
        size={size}
        color={color}
      />,
    );
  }
  return <group>{blocks}</group>;
}

/** A run of stairs descending in +Z (rotate the group to aim it). */
export function Stairs({
  p,
  r,
  steps,
  width = 0.34,
  rise = 0.055,
  run = 0.085,
  color = CLAY.cream,
}: {
  p: Vec3;
  r?: Vec3;
  steps: number;
  width?: number;
  rise?: number;
  run?: number;
  color?: string;
}) {
  const boxes = [];
  for (let i = 0; i < steps; i++) {
    boxes.push(
      <BoxP
        key={i}
        p={[0, -i * rise - rise / 2, i * run]}
        size={[width, rise, run * 1.35]}
        color={color}
      />,
    );
  }
  return (
    <group position={p} rotation={r}>
      {boxes}
    </group>
  );
}

/** Round puffy tree: a cluster of spheres on a short trunk. */
export function Tree({
  p,
  s = 1,
  color = CLAY.bone,
}: {
  p: Vec3;
  s?: number;
  color?: string;
}) {
  return (
    <group position={p} scale={s}>
      <Cyl p={[0, 0.07, 0]} rTop={0.02} rBot={0.028} h={0.14} color={CLAY.dim} />
      {(
        [
          [0, 0.24, 0, 0.115],
          [-0.08, 0.18, 0.03, 0.075],
          [0.08, 0.19, -0.02, 0.08],
          [0.02, 0.3, 0.05, 0.06],
        ] as const
      ).map(([x, y, z, rad], i) => (
        <mesh key={i} position={[x, y, z]} castShadow receiveShadow>
          <sphereGeometry args={[rad, 20, 16]} />
          <ClayMat color={color} />
        </mesh>
      ))}
    </group>
  );
}

/** Slim pine: two stacked soft cones. */
export function Pine({
  p,
  s = 1,
  color = CLAY.bone,
}: {
  p: Vec3;
  s?: number;
  color?: string;
}) {
  return (
    <group position={p} scale={s}>
      <Cyl p={[0, 0.05, 0]} rTop={0.018} rBot={0.024} h={0.1} color={CLAY.dim} />
      <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.09, 0.3, 20]} />
        <ClayMat color={color} />
      </mesh>
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.062, 0.22, 20]} />
        <ClayMat color={color} />
      </mesh>
    </group>
  );
}

/** Puffy cloud: a drifting cluster of clay spheres. */
export function Cloud({
  p,
  s = 1,
  color = CLAY.cream,
}: {
  p: Vec3;
  s?: number;
  color?: string;
}) {
  return (
    <group position={p} scale={s}>
      {(
        [
          [0, 0, 0, 0.16],
          [-0.17, -0.02, 0.02, 0.11],
          [0.17, -0.01, -0.02, 0.12],
          [0.05, 0.09, 0.03, 0.09],
          [-0.28, -0.04, 0, 0.07],
        ] as const
      ).map(([x, y, z, rad], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <sphereGeometry args={[rad, 20, 16]} />
          <ClayMat color={color} rough={1} />
        </mesh>
      ))}
    </group>
  );
}

/** Freestanding arch: half a torus planted on the ground. */
export function Arch({
  p,
  r,
  radius,
  tube,
  color = CLAY.cream,
}: {
  p: Vec3;
  r?: Vec3;
  radius: number;
  tube: number;
  color?: string;
}) {
  return (
    <mesh position={p} rotation={r} castShadow receiveShadow>
      <torusGeometry args={[radius, tube, 16, 32, Math.PI]} />
      <ClayMat color={color} />
    </mesh>
  );
}

/** Needle spire for tower tops. */
export function Spire({
  p,
  h,
  radius = 0.02,
  color = CLAY.cream,
}: {
  p: Vec3;
  h: number;
  radius?: number;
  color?: string;
}) {
  return (
    <mesh position={p} castShadow>
      <coneGeometry args={[radius, h, 10]} />
      <ClayMat color={color} />
    </mesh>
  );
}

/** Slender wooden support strut for recovering states. */
export function Strut({
  p,
  r,
  length,
  radius = 0.014,
}: {
  p: Vec3;
  r?: Vec3;
  length: number;
  radius?: number;
}) {
  return (
    <mesh position={p} rotation={r} castShadow>
      <capsuleGeometry args={[radius, length, 6, 12]} />
      <ClayMat color={CLAY.strut} rough={0.85} />
    </mesh>
  );
}

/** Construction scaffold: two uprights and a plank, for half-built tiers. */
export function Scaffold({
  p,
  r,
  w = 0.3,
  h = 0.42,
}: {
  p: Vec3;
  r?: Vec3;
  w?: number;
  h?: number;
}) {
  return (
    <group position={p} rotation={r}>
      <Strut p={[-w / 2, h / 2, 0]} length={h} radius={0.011} />
      <Strut p={[w / 2, h / 2, 0]} length={h} radius={0.011} />
      <BoxP p={[0, h * 0.72, 0]} size={[w + 0.12, 0.022, 0.09]} color={CLAY.strut} />
      <BoxP p={[0, h * 0.38, 0]} size={[w + 0.12, 0.022, 0.09]} color={CLAY.strut} />
    </group>
  );
}

/** Stacked building stones waiting to be laid. */
export function StonePile({ p, r }: { p: Vec3; r?: Vec3 }) {
  return (
    <group position={p} rotation={r}>
      <BoxP p={[0, 0.035, 0]} size={[0.17, 0.07, 0.11]} color={CLAY.bone} />
      <BoxP p={[0.05, 0.1, 0.02]} r={[0, 0.4, 0]} size={[0.1, 0.06, 0.08]} color={CLAY.dim} />
      <BoxP p={[-0.05, 0.1, -0.02]} r={[0, -0.3, 0]} size={[0.09, 0.06, 0.07]} color={CLAY.bone} />
    </group>
  );
}

/** Warm emissive dot: windows, lanterns, hearths. */
export function GlowDot({
  p,
  radius = 0.03,
  s,
  color,
  intensity,
}: {
  p?: Vec3;
  radius?: number;
  s?: Vec3;
  color: string;
  intensity: number;
}) {
  return (
    <mesh position={p} scale={s}>
      <sphereGeometry args={[radius, 16, 12]} />
      <meshStandardMaterial
        color="#232326"
        emissive={color}
        emissiveIntensity={intensity}
        roughness={0.6}
      />
    </mesh>
  );
}

/** A thin seam laid along a surface — dark crack, or glowing gold repair. */
export function Seam({
  p,
  r,
  length,
  intensity = 0,
  color = "#ff7500",
}: {
  p: Vec3;
  r?: Vec3;
  length: number;
  intensity?: number;
  color?: string;
}) {
  return (
    <mesh position={p} rotation={r}>
      <capsuleGeometry args={[0.013, length, 4, 8]} />
      <meshStandardMaterial
        color={intensity > 0 ? "#c4590a" : CLAY.crack}
        emissive={intensity > 0 ? color : "#000000"}
        emissiveIntensity={intensity}
        roughness={0.7}
      />
    </mesh>
  );
}

/** A waypoint light whose glow pulses in sequence along the route. */
export function PulseDot({
  p,
  radius,
  color,
  base,
  phase,
}: {
  p: Vec3;
  radius: number;
  color: string;
  base: number;
  phase: number;
}) {
  const mat = useRef<MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (mat.current) {
      mat.current.emissiveIntensity =
        base * (0.7 + 0.5 * Math.sin(clock.getElapsedTime() * 2.4 - phase));
    }
  });
  return (
    <mesh position={p}>
      <sphereGeometry args={[radius, 16, 12]} />
      <meshStandardMaterial
        ref={mat}
        color="#232326"
        emissive={color}
        emissiveIntensity={base}
        roughness={0.6}
      />
    </mesh>
  );
}

/**
 * A paving slab for recovery roads. Lit slabs are clay one tone warmer
 * than bone with a faint inner warmth in the theme's accent — stone that
 * holds light, not painted signage. Unlit ones sit as dark inert stone
 * waiting to be finished.
 */
export function RoadSlab({
  p,
  r,
  size = [0.22, 0.022, 0.16],
  lit,
  accent,
  intensity = 1,
}: {
  p: Vec3;
  r?: Vec3;
  size?: Vec3;
  lit: boolean;
  accent: string;
  intensity?: number;
}) {
  return (
    <mesh position={p} rotation={r} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={lit ? "#ffd9ad" : CLAY.deep}
        emissive={lit ? accent : "#000000"}
        emissiveIntensity={lit ? 0.16 * intensity : 0}
        roughness={0.75}
      />
    </mesh>
  );
}

/** Small scattered rubble for damaged states. */
export function PebblePile({
  p,
  color = CLAY.dim,
  spread = 0.2,
  count = 5,
  seed = 1,
}: {
  p: Vec3;
  color?: string;
  spread?: number;
  count?: number;
  seed?: number;
}) {
  const pieces = [];
  for (let i = 0; i < count; i++) {
    const a = Math.sin(seed * 37 + i * 91.7) * 0.5 + 0.5;
    const b = Math.sin(seed * 53 + i * 47.3) * 0.5 + 0.5;
    const rad = 0.03 + a * 0.045;
    pieces.push(
      <mesh
        key={i}
        position={[
          p[0] + (a - 0.5) * 2 * spread,
          p[1] + rad * 0.7,
          p[2] + (b - 0.5) * 2 * spread,
        ]}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[rad, 12, 10]} />
        <ClayMat color={color} />
      </mesh>,
    );
  }
  return <group>{pieces}</group>;
}
