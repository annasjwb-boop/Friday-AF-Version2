import { useMemo } from "react";
import { CanvasTexture, RepeatWrapping } from "three";

type Vec3 = [number, number, number];

/**
 * Monochrome clay palette tuned to the Dusk Grain backdrop: cool porcelain
 * and bone-gray masses with slate recesses, so the models read as the same
 * material family as the mesh behind them. Amber stays the one warm accent.
 */
export const CLAY = {
  cream: "#e8e4d8",
  bone: "#d1ccbe",
  dim: "#a9a598",
  deep: "#2c2c31",
  cool: "#d2dbde",
  coolDim: "#a2afb2",
  water: "#76868c",
  strut: "#9b8a71",
  crack: "#1b1c20",
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

/** The one material: matte porcelain clay. */
export function ClayMat({
  color = CLAY.cream,
  rough = 0.92,
  flat = false,
}: {
  color?: string;
  rough?: number;
  flat?: boolean;
}) {
  const grain = useMemo(getGrainTexture, []);
  return (
    <meshStandardMaterial
      color={color}
      roughness={rough}
      metalness={0}
      flatShading={flat}
      bumpMap={grain}
      bumpScale={0.12}
    />
  );
}

/** Generic clay box. */
export function BoxP({
  p,
  r,
  size,
  color = CLAY.cream,
}: {
  p?: Vec3;
  r?: Vec3;
  size: Vec3;
  color?: string;
}) {
  return (
    <mesh position={p} rotation={r} castShadow receiveShadow>
      <boxGeometry args={size} />
      <ClayMat color={color} />
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
}: {
  p?: Vec3;
  r?: Vec3;
  rTop: number;
  rBot: number;
  h: number;
  color?: string;
  flat?: boolean;
  seg?: number;
}) {
  return (
    <mesh position={p} rotation={r} castShadow receiveShadow>
      <cylinderGeometry args={[rTop, rBot, h, seg]} />
      <ClayMat color={color} flat={flat} />
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
}: {
  p?: Vec3;
  r?: Vec3;
  radius: number;
  h: number;
  color?: string;
  sides?: number;
}) {
  return (
    <mesh position={p} rotation={r} castShadow receiveShadow>
      <coneGeometry args={[radius, h, sides]} />
      <ClayMat color={color} flat />
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
        color="#2a2118"
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
  color = "#e8a35c",
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
        color={intensity > 0 ? "#9c7743" : CLAY.crack}
        emissive={intensity > 0 ? color : "#000000"}
        emissiveIntensity={intensity}
        roughness={0.7}
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
