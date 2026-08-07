import type { ReactNode } from "react";
import { RoundedBox } from "@react-three/drei";

type Vec3 = [number, number, number];

/**
 * Atlas miniature palette: a grounded, masculine key — weathered
 * limestone, graphite slate, verdigris copper, dark oak, iron and antique
 * brass, oxblood banners, mossy earth. Sculpted clay, not candy.
 */
export const TOY = {
  cream: "#c8b89d",
  creamShade: "#a8967a",
  stone: "#8c7c64",
  rust: "#8f3b2b",
  slate: "#4a5263",
  steel: "#3d4a63",
  navy: "#2e3850",
  teal: "#3e6b5a",
  tealDeep: "#2f5447",
  gold: "#b98a3c",
  ember: "#c05a25",
  grass: "#4a7a3c",
  grassDeep: "#3a622f",
  leaf: "#4a7d3a",
  leafOrange: "#9c5a26",
  pine: "#395c31",
  trunk: "#5f462e",
  timber: "#4a3722",
  iron: "#3b3b44",
  dirt: "#7d6547",
  rock: "#666973",
  rockDeep: "#4d505c",
  gateDark: "#26212c",
  glow: "#ffb45c",
};

/**
 * Sculpted-clay material: soft satin sheen rather than hard gloss, always
 * smooth-shaded. `matte` kills the sheen entirely for grass and foliage so
 * those greens stay saturated instead of catching the sky and bleaching.
 */
export function ToyMat({
  color,
  rough = 0.45,
  matte = false,
}: {
  color: string;
  rough?: number;
  matte?: boolean;
}) {
  return (
    <meshPhysicalMaterial
      color={color}
      roughness={matte ? 0.75 : rough}
      metalness={0}
      clearcoat={matte ? 0.1 : 0.55}
      clearcoatRoughness={0.45}
      envMapIntensity={matte ? 0.2 : 0.42}
    />
  );
}

/** Box with softly rounded edges — every block reads as pressed clay. */
export function BoxT({
  p,
  r,
  size,
  color,
}: {
  p?: Vec3;
  r?: Vec3;
  size: Vec3;
  color: string;
}) {
  const bevel = Math.min(0.03, Math.min(size[0], size[1], size[2]) * 0.32);
  return (
    <RoundedBox position={p} rotation={r} args={size} radius={bevel} smoothness={3}>
      <ToyMat color={color} />
    </RoundedBox>
  );
}

export function CylT({
  p,
  r,
  rTop,
  rBot,
  h,
  color,
  seg = 28,
  matte = false,
}: {
  p?: Vec3;
  r?: Vec3;
  rTop: number;
  rBot: number;
  h: number;
  color: string;
  seg?: number;
  matte?: boolean;
}) {
  return (
    <mesh position={p} rotation={r}>
      <cylinderGeometry args={[rTop, rBot, h, seg]} />
      <ToyMat color={color} matte={matte} />
    </mesh>
  );
}

export function SphereT({
  p,
  radius,
  color,
  s,
  matte = false,
}: {
  p?: Vec3;
  radius: number;
  color: string;
  s?: Vec3;
  matte?: boolean;
}) {
  return (
    <mesh position={p} scale={s}>
      <sphereGeometry args={[radius, 20, 16]} />
      <ToyMat color={color} matte={matte} />
    </mesh>
  );
}

/**
 * Coiled clay roof: smooth, slightly overhanging rings rising to a soft
 * tip — the tiled cone roofs from the reference art, hand-rolled.
 */
export function ShingleRoof({
  p,
  radius,
  h,
  color,
  trim,
  tiers = 4,
}: {
  p: Vec3;
  radius: number;
  h: number;
  color: string;
  /** Optional contrasting ring at the eaves (gold in the reference). */
  trim?: string;
  tiers?: number;
}) {
  const rows = [];
  const rowH = h / (tiers + 0.6);
  for (let i = 0; i < tiers; i++) {
    const t0 = i / tiers;
    const t1 = (i + 1) / tiers;
    rows.push(
      <CylT
        key={i}
        p={[0, rowH * (i + 0.5), 0]}
        rTop={radius * (1 - t1) * 0.92 + 0.015}
        rBot={radius * (1 - t0)}
        h={rowH}
        color={color}
      />,
    );
  }
  return (
    <group position={p}>
      {trim && (
        <CylT p={[0, 0.012, 0]} rTop={radius * 1.06} rBot={radius * 1.1} h={0.05} color={trim} />
      )}
      {rows}
      <CylT
        p={[0, rowH * tiers + rowH * 0.3, 0]}
        rTop={0.012}
        rBot={radius * 0.14}
        h={rowH * 1.1}
        color={color}
      />
      {/* Iron spike finial with a brass ball — forged, not frosted. */}
      <CylT
        p={[0, rowH * tiers + rowH * 0.85, 0]}
        rTop={0.005}
        rBot={0.009}
        h={0.07}
        color={TOY.iron}
      />
      <SphereT p={[0, rowH * tiers + rowH * 0.85 + 0.045, 0]} radius={0.016} color={TOY.gold} />
    </group>
  );
}

/** Pole-mounted pennant flag streaming to one side. */
export function Pennant({
  p,
  h = 0.24,
  color = TOY.ember,
}: {
  p: Vec3;
  h?: number;
  color?: string;
}) {
  return (
    <group position={p}>
      <CylT p={[0, h / 2, 0]} rTop={0.008} rBot={0.011} h={h} color={TOY.trunk} seg={8} />
      <mesh position={[0.085, h - 0.035, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[1, 1, 0.22]}>
        <coneGeometry args={[0.045, 0.17, 12]} />
        <ToyMat color={color} />
      </mesh>
    </group>
  );
}

/** Chunky merlon ring around a tower rim. */
export function MerlonRing({
  p,
  radius,
  count,
  size = [0.09, 0.09, 0.08],
  color = TOY.cream,
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
      <BoxT
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

/** Chunky merlons along a straight wall top (local X axis). */
export function MerlonRow({
  p,
  rotY = 0,
  len,
  count,
  size = [0.11, 0.09, 0.13],
  color = TOY.cream,
}: {
  p: Vec3;
  rotY?: number;
  len: number;
  count: number;
  size?: Vec3;
  color?: string;
}) {
  const blocks = [];
  for (let i = 0; i < count; i++) {
    const x = (i / (count - 1) - 0.5) * (len - size[0]);
    blocks.push(<BoxT key={i} p={[x, 0, 0]} size={size} color={color} />);
  }
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      {blocks}
    </group>
  );
}

/**
 * Curtain wall: foundation skirt, corbels supporting the cap course,
 * chunky crenellation above.
 */
export function ToyWall({
  p,
  rotY = 0,
  len,
  h = 0.44,
  color = TOY.cream,
  cap = TOY.creamShade,
  merlons = 5,
}: {
  p: Vec3;
  rotY?: number;
  len: number;
  h?: number;
  color?: string;
  cap?: string;
  merlons?: number;
}) {
  const corbels = [];
  for (let i = 0; i < merlons * 2 - 1; i++) {
    const x = (i / (merlons * 2 - 2) - 0.5) * (len - 0.12);
    corbels.push(
      <BoxT key={i} p={[x, h - 0.035, 0.075]} size={[0.035, 0.045, 0.035]} color={TOY.stone} />,
    );
  }
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      {/* Foundation course, wider and darker than the wall face. */}
      <BoxT p={[0, 0.045, 0]} size={[len + 0.04, 0.1, 0.2]} color={TOY.stone} />
      <BoxT p={[0, h / 2, 0]} size={[len, h, 0.16]} color={color} />
      {/* Laid-stone courses carved across the outer face. */}
      <BrickCourses p={[0, h * 0.52, 0.082]} w={len} h={h * 0.8} seed={len * 13} />
      {corbels}
      <BoxT p={[0, h + 0.03, 0]} size={[len + 0.05, 0.07, 0.21]} color={cap} />
      <MerlonRow p={[0, h + 0.11, 0]} len={len} count={merlons} color={cap} />
    </group>
  );
}

/** Arched window: trim pill frame with a warm lit pane inside. */
export function ToyWindow({
  p,
  rotY = 0,
  s = 1,
  frame = TOY.creamShade,
  lit = true,
}: {
  p: Vec3;
  rotY?: number;
  s?: number;
  frame?: string;
  lit?: boolean;
}) {
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      <mesh scale={[1, 1, 0.42]}>
        <capsuleGeometry args={[0.038, 0.05, 6, 12]} />
        <ToyMat color={frame} />
      </mesh>
      <mesh position={[0, 0, 0.012]} scale={[1, 1, 0.42]}>
        <capsuleGeometry args={[0.026, 0.045, 6, 12]} />
        <meshStandardMaterial
          color="#5a4030"
          emissive={TOY.glow}
          emissiveIntensity={lit ? 1.5 : 0}
          roughness={0.5}
        />
      </mesh>
      {/* Sill ledge under the window. */}
      <BoxT p={[0, -0.062, 0.008]} size={[0.1, 0.024, 0.035]} color={frame} />
    </group>
  );
}

/** Framed arch gate: stone surround, dark recess, threshold step. */
export function ToyGate({
  p,
  rotY = 0,
  s = 1,
  frame = TOY.rust,
}: {
  p: Vec3;
  rotY?: number;
  s?: number;
  frame?: string;
}) {
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      {/* Stone surround: an arch of chunky voussoirs over jamb blocks. */}
      <mesh position={[0, 0.22, 0]} rotation={[0, 0, 0]} scale={[1, 1, 0.5]}>
        <torusGeometry args={[0.15, 0.055, 12, 28, Math.PI]} />
        <ToyMat color={frame} />
      </mesh>
      <BoxT p={[-0.15, 0.09, 0]} size={[0.1, 0.28, 0.09]} color={frame} />
      <BoxT p={[0.15, 0.09, 0]} size={[0.1, 0.28, 0.09]} color={frame} />
      {/* Dark recess with a rounded head. */}
      <BoxT p={[0, 0.1, -0.012]} size={[0.21, 0.24, 0.06]} color={TOY.gateDark} />
      <mesh position={[0, 0.22, -0.012]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.6, 1]}>
        <cylinderGeometry args={[0.105, 0.105, 0.06, 16, 1, false, 0, Math.PI]} />
        <ToyMat color={TOY.gateDark} />
      </mesh>
      <BoxT p={[0, -0.045, 0.09]} size={[0.36, 0.05, 0.16]} color={TOY.stone} />
    </group>
  );
}

/**
 * Stone blocks sitting slightly proud of a wall face — the patched
 * masonry from the reference art. Group origin goes at the wall surface.
 */
export function StonePatch({
  p,
  rotY = 0,
  w,
  h,
  seed = 1,
  color = TOY.stone,
}: {
  p: Vec3;
  rotY?: number;
  /** Face width/height the blocks scatter across. */
  w: number;
  h: number;
  seed?: number;
  color?: string;
}) {
  const blocks = [];
  for (let i = 0; i < 5; i++) {
    const u = Math.sin(seed * 12.9 + i * 78.2);
    const v = Math.sin(seed * 3.7 + i * 39.4);
    blocks.push(
      <BoxT
        key={i}
        p={[u * w * 0.4, v * h * 0.36, 0]}
        size={[0.06 + 0.05 * Math.abs(Math.sin(i * 3.3 + seed)), 0.045, 0.024]}
        color={i % 3 === 0 ? TOY.creamShade : color}
      />,
    );
  }
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      {blocks}
    </group>
  );
}

/**
 * Carved masonry courses: mortar lines and staggered brick seams sitting
 * just proud of a wall face, so the surface reads as laid stone.
 */
export function BrickCourses({
  p,
  rotY = 0,
  w,
  h,
  seed = 1,
}: {
  p: Vec3;
  rotY?: number;
  w: number;
  h: number;
  seed?: number;
}) {
  const lines = [];
  const rows = 3;
  for (let r = 0; r < rows; r++) {
    const y = (r / (rows - 1) - 0.5) * h * 0.72;
    lines.push(
      <BoxT key={`m${r}`} p={[0, y, 0]} size={[w * 0.94, 0.014, 0.012]} color={TOY.creamShade} />,
    );
    for (let i = 0; i < 3; i++) {
      const x = (Math.sin(seed * 17 + r * 31 + i * 57) * 0.5) * w * 0.8;
      lines.push(
        <BoxT
          key={`t${r}-${i}`}
          p={[x, y + h * 0.18, 0]}
          size={[0.013, h * 0.3, 0.012]}
          color={TOY.creamShade}
        />,
      );
    }
  }
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      {lines}
    </group>
  );
}

/** Arched oak door: planks, iron strap hinges, studs, brass ring. */
export function PlankDoor({
  p,
  rotY = 0,
  s = 1,
}: {
  p: Vec3;
  rotY?: number;
  s?: number;
}) {
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      {[-0.06, -0.02, 0.02, 0.06].map((x) => (
        <BoxT
          key={x}
          p={[x, 0.115 - Math.abs(x) * 0.35, 0]}
          size={[0.044, 0.27 - Math.abs(x) * 0.7, 0.02]}
          color={TOY.timber}
        />
      ))}
      {/* Iron strap hinges banding the planks. */}
      <BoxT p={[0, 0.16, 0.011]} size={[0.14, 0.022, 0.012]} color={TOY.iron} />
      <BoxT p={[0, 0.055, 0.011]} size={[0.155, 0.022, 0.012]} color={TOY.iron} />
      {/* Stud heads along the straps. */}
      <SphereT p={[-0.05, 0.16, 0.018]} radius={0.008} color={TOY.iron} />
      <SphereT p={[0.05, 0.16, 0.018]} radius={0.008} color={TOY.iron} />
      <SphereT p={[-0.06, 0.055, 0.018]} radius={0.008} color={TOY.iron} />
      <SphereT p={[0.06, 0.055, 0.018]} radius={0.008} color={TOY.iron} />
      {/* Brass pull ring. */}
      <mesh position={[0.042, 0.105, 0.018]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.016, 0.005, 8, 14]} />
        <ToyMat color={TOY.gold} />
      </mesh>
    </group>
  );
}

/** Stepped stone buttress leaning into a wall (back against local -z). */
export function Buttress({
  p,
  rotY = 0,
  h = 0.34,
  color = TOY.stone,
}: {
  p: Vec3;
  rotY?: number;
  h?: number;
  color?: string;
}) {
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <BoxT p={[0, h * 0.22, 0.035]} size={[0.11, h * 0.44, 0.11]} color={color} />
      <BoxT p={[0, h * 0.6, 0.01]} size={[0.09, h * 0.42, 0.075]} color={color} />
      <BoxT p={[0, h * 0.46, 0.045]} r={[0.5, 0, 0]} size={[0.09, 0.05, 0.07]} color={color} />
    </group>
  );
}

/** Oak barrel with iron hoops. */
export function Barrel({
  p,
  s = 1,
}: {
  p: Vec3;
  s?: number;
}) {
  return (
    <group position={p} scale={s}>
      <CylT p={[0, 0.07, 0]} rTop={0.05} rBot={0.05} h={0.14} color={TOY.timber} />
      <CylT p={[0, 0.07, 0]} rTop={0.058} rBot={0.058} h={0.05} color={TOY.trunk} />
      <CylT p={[0, 0.035, 0]} rTop={0.054} rBot={0.054} h={0.014} color={TOY.iron} />
      <CylT p={[0, 0.105, 0]} rTop={0.054} rBot={0.054} h={0.014} color={TOY.iron} />
    </group>
  );
}

/** Banded wooden crate. */
export function Crate({
  p,
  rotY = 0,
  s = 1,
}: {
  p: Vec3;
  rotY?: number;
  s?: number;
}) {
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      <BoxT p={[0, 0.06, 0]} size={[0.12, 0.12, 0.12]} color={TOY.trunk} />
      <BoxT p={[0, 0.06, 0]} size={[0.126, 0.024, 0.126]} color={TOY.timber} />
      <BoxT p={[0, 0.115, 0]} size={[0.126, 0.014, 0.126]} color={TOY.timber} />
    </group>
  );
}

/** Oxblood banner hanging from a wall rod, brass emblem at its heart. */
export function WallBanner({
  p,
  rotY = 0,
  s = 1,
  color = TOY.rust,
}: {
  p: Vec3;
  rotY?: number;
  s?: number;
  color?: string;
}) {
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      <CylT p={[0, 0, 0]} r={[0, 0, Math.PI / 2]} rTop={0.008} rBot={0.008} h={0.17} color={TOY.timber} />
      <BoxT p={[0, -0.1, 0]} size={[0.13, 0.2, 0.014]} color={color} />
      <mesh position={[0, -0.225, 0]} rotation={[0, Math.PI / 4, Math.PI]} scale={[1, 1, 0.16]}>
        <coneGeometry args={[0.066, 0.06, 4]} />
        <ToyMat color={color} />
      </mesh>
      <SphereT p={[0, -0.1, 0.01]} radius={0.02} color={TOY.gold} s={[1, 1, 0.5]} />
    </group>
  );
}

/** Iron wall sconce holding a live flame. */
export function Sconce({
  p,
  rotY = 0,
}: {
  p: Vec3;
  rotY?: number;
}) {
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <BoxT p={[0, -0.01, -0.012]} size={[0.02, 0.06, 0.028]} color={TOY.iron} />
      <CylT p={[0, 0.025, 0.012]} rTop={0.022} rBot={0.011} h={0.05} color={TOY.iron} />
      <mesh position={[0, 0.07, 0.012]} scale={[1, 1.5, 1]}>
        <sphereGeometry args={[0.019, 10, 8]} />
        <meshStandardMaterial
          color="#4a2c14"
          emissive={TOY.glow}
          emissiveIntensity={2}
          roughness={0.5}
        />
      </mesh>
    </group>
  );
}

/** Dark pine — stacked boughs on a bare trunk. */
export function ToyPine({
  p,
  s = 1,
  color = TOY.pine,
}: {
  p: Vec3;
  s?: number;
  color?: string;
}) {
  return (
    <group position={p} scale={s}>
      <CylT p={[0, 0.07, 0]} rTop={0.024} rBot={0.032} h={0.14} color={TOY.trunk} matte />
      <mesh position={[0, 0.2, 0]}>
        <coneGeometry args={[0.115, 0.2, 16]} />
        <ToyMat color={color} matte />
      </mesh>
      <mesh position={[0, 0.33, 0]}>
        <coneGeometry args={[0.088, 0.17, 16]} />
        <ToyMat color={color} matte />
      </mesh>
      <mesh position={[0, 0.44, 0]}>
        <coneGeometry args={[0.06, 0.14, 16]} />
        <ToyMat color={color} matte />
      </mesh>
    </group>
  );
}

/** Ivy creeping up a wall face — flattened moss blobs. */
export function Ivy({
  p,
  rotY = 0,
  s = 1,
}: {
  p: Vec3;
  rotY?: number;
  s?: number;
}) {
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      <SphereT p={[0, 0, 0]} radius={0.07} color={TOY.pine} s={[1, 1.3, 0.3]} matte />
      <SphereT p={[0.05, 0.09, 0]} radius={0.05} color={TOY.grassDeep} s={[1, 1.2, 0.3]} matte />
      <SphereT p={[-0.045, 0.12, 0]} radius={0.04} color={TOY.pine} s={[1, 1.1, 0.3]} matte />
      <SphereT p={[0.01, 0.19, 0]} radius={0.03} color={TOY.grassDeep} s={[1, 1, 0.3]} matte />
    </group>
  );
}

/** Flagstones meandering away from a gate (local +z). */
export function PathStones({
  p,
  rotY = 0,
  count = 4,
  seed = 1,
}: {
  p: Vec3;
  rotY?: number;
  count?: number;
  seed?: number;
}) {
  const stones = [];
  for (let i = 0; i < count; i++) {
    const jitter = Math.sin(seed * 9 + i * 31) * 0.05;
    stones.push(
      <mesh
        key={i}
        position={[jitter, 0.012, i * 0.17]}
        scale={[1 + (i % 2) * 0.3, 0.3, 0.75]}
      >
        <sphereGeometry args={[0.078, 14, 10]} />
        <ToyMat color={TOY.stone} matte />
      </mesh>,
    );
  }
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      {stones}
    </group>
  );
}

/** Chunky stair run descending along local +z. */
export function ToyStairs({
  p,
  rotY = 0,
  steps = 3,
  width = 0.3,
}: {
  p: Vec3;
  rotY?: number;
  steps?: number;
  width?: number;
}) {
  const run = [];
  for (let i = 0; i < steps; i++) {
    run.push(
      <BoxT
        key={i}
        p={[0, -i * 0.038 - 0.02, i * 0.08]}
        size={[width, 0.05, 0.1]}
        color={TOY.stone}
      />,
    );
  }
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      {run}
    </group>
  );
}

/** Little dormer poking through a roof, window lit. */
export function Dormer({
  p,
  rotY = 0,
  s = 1,
  roof = TOY.navy,
}: {
  p: Vec3;
  rotY?: number;
  s?: number;
  roof?: string;
}) {
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      <BoxT p={[0, 0, 0]} size={[0.11, 0.12, 0.1]} color={TOY.cream} />
      <mesh position={[0, 0.09, 0]}>
        <coneGeometry args={[0.082, 0.1, 16]} />
        <ToyMat color={roof} />
      </mesh>
      <ToyWindow p={[0, 0.005, 0.052]} s={0.7} />
    </group>
  );
}

/** Narrow dark arrow slit pressed into masonry. */
export function ArrowSlit({
  p,
  rotY = 0,
}: {
  p: Vec3;
  rotY?: number;
}) {
  return (
    <mesh position={p} rotation={[0, rotY, 0]} scale={[1, 1, 0.4]}>
      <capsuleGeometry args={[0.012, 0.05, 4, 8]} />
      <ToyMat color={TOY.gateDark} />
    </mesh>
  );
}

/** Iron post brazier with a warm burning orb. */
export function Lantern({
  p,
  h = 0.16,
}: {
  p: Vec3;
  h?: number;
}) {
  return (
    <group position={p}>
      <CylT p={[0, h / 2, 0]} rTop={0.011} rBot={0.016} h={h} color={TOY.iron} />
      <CylT p={[0, h + 0.005, 0]} rTop={0.028} rBot={0.016} h={0.03} color={TOY.iron} />
      <mesh position={[0, h + 0.035, 0]}>
        <sphereGeometry args={[0.026, 14, 12]} />
        <meshStandardMaterial
          color="#4a2c14"
          emissive={TOY.glow}
          emissiveIntensity={1.8}
          roughness={0.5}
        />
      </mesh>
    </group>
  );
}

/** Round-blob tree on a stubby trunk (green or autumn orange). */
export function ToyTree({
  p,
  s = 1,
  color = TOY.leaf,
}: {
  p: Vec3;
  s?: number;
  color?: string;
}) {
  return (
    <group position={p} scale={s}>
      <CylT p={[0, 0.08, 0]} rTop={0.026} rBot={0.034} h={0.16} color={TOY.trunk} seg={10} matte />
      <SphereT p={[0, 0.27, 0]} radius={0.13} color={color} matte />
      <SphereT p={[-0.09, 0.2, 0.03]} radius={0.085} color={color} matte />
      <SphereT p={[0.09, 0.22, -0.03]} radius={0.09} color={color} matte />
      <SphereT p={[0.02, 0.35, 0.04]} radius={0.065} color={color} matte />
    </group>
  );
}

/** Low rounded bush. */
export function ToyBush({
  p,
  s = 1,
  color = TOY.grassDeep,
}: {
  p: Vec3;
  s?: number;
  color?: string;
}) {
  return (
    <group position={p} scale={s}>
      <SphereT p={[0, 0.05, 0]} radius={0.075} color={color} s={[1, 0.8, 1]} matte />
      <SphereT p={[0.08, 0.04, 0.02]} radius={0.055} color={color} s={[1, 0.8, 1]} matte />
      <SphereT p={[-0.07, 0.04, -0.02]} radius={0.05} color={color} s={[1, 0.75, 1]} matte />
    </group>
  );
}

/** Puffy toy cloud. */
export function ToyCloud({
  p,
  s = 1,
  color = "#ffffff",
}: {
  p: Vec3;
  s?: number;
  color?: string;
}) {
  return (
    <group position={p} scale={s}>
      <SphereT p={[0, 0, 0]} radius={0.15} color={color} />
      <SphereT p={[-0.16, -0.02, 0.02]} radius={0.1} color={color} />
      <SphereT p={[0.16, -0.01, -0.02]} radius={0.11} color={color} />
      <SphereT p={[0.04, 0.08, 0.03]} radius={0.085} color={color} />
    </group>
  );
}

/** Soft lumpy boulder — a pinched ball of clay. */
export function ToyRock({
  p,
  s = 1,
  color = TOY.rock,
}: {
  p: Vec3;
  s?: number;
  color?: string;
}) {
  return (
    <mesh position={p} scale={[s, s * 0.8, s * 0.92]}>
      <icosahedronGeometry args={[0.09, 1]} />
      <ToyMat color={color} matte />
    </mesh>
  );
}

/** Tiny scattered flowers and pebbles that dress the grass. */
export function Sprinkles({
  p = [0, 0, 0],
  radius,
  seed = 1,
  count = 10,
}: {
  p?: Vec3;
  radius: number;
  seed?: number;
  count?: number;
}) {
  const petals = [TOY.stone, TOY.gold, "#d9d2c0", TOY.ember];
  const dots = [];
  for (let i = 0; i < count; i++) {
    const a = Math.sin(seed * 91.7 + i * 37.3) * Math.PI * 2;
    const d = (Math.sin(seed * 13.7 + i * 53.1) * 0.5 + 0.5) * radius;
    const x = p[0] + Math.cos(a) * d;
    const z = p[2] + Math.sin(a) * d;
    const kind = Math.abs(Math.round(Math.sin(seed * 7 + i * 17) * 5)) % 5;
    if (kind === 4) {
      // Grass tuft: a tiny cluster of soft spikes.
      dots.push(
        <group key={i} position={[x, p[1], z]}>
          <mesh position={[0, 0.025, 0]}>
            <coneGeometry args={[0.02, 0.06, 8]} />
            <ToyMat color={TOY.grassDeep} matte />
          </mesh>
          <mesh position={[0.022, 0.018, 0.008]}>
            <coneGeometry args={[0.014, 0.042, 8]} />
            <ToyMat color={TOY.grassDeep} matte />
          </mesh>
        </group>,
      );
    } else {
      dots.push(
        <SphereT
          key={i}
          p={[x, p[1], z]}
          radius={0.018 + (kind === 0 ? 0.012 : 0)}
          color={kind === 0 ? TOY.stone : petals[kind]}
          s={[1, 0.7, 1]}
        />,
      );
    }
  }
  return <group>{dots}</group>;
}

/** Top surface height of the grass island base. */
export const ISLAND_TOP = 0.3;

/**
 * The grass mound every diorama stands on: a dirt slab under a rounded
 * grass cap — the little landscaped island from the reference renders.
 */
export function GrassIsland({
  radius = 1.3,
  grass = TOY.grass,
  dirt = TOY.dirt,
  children,
}: {
  radius?: number;
  grass?: string;
  dirt?: string;
  children?: ReactNode;
}) {
  return (
    <group>
      <CylT p={[0, 0.09, 0]} rTop={radius * 0.99} rBot={radius * 0.88} h={0.18} color={dirt} seg={36} matte />
      <CylT p={[0, 0.24, 0]} rTop={radius} rBot={radius * 0.99} h={0.12} color={grass} seg={36} matte />
      {/* Rounded grass lip so the edge reads soft, not machined. */}
      <mesh position={[0, 0.24, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 0.98, 0.055, 10, 36]} />
        <ToyMat color={grass} matte />
      </mesh>
      <Sprinkles p={[0, ISLAND_TOP + 0.01, 0]} radius={radius * 0.85} seed={radius * 7} count={12} />
      {children}
    </group>
  );
}

/** Round tower: body, cap course, shingle roof, optional pennant. */
export function ToyTower({
  p,
  rBody = 0.16,
  h = 0.7,
  body = TOY.cream,
  cap = TOY.creamShade,
  roof = TOY.steel,
  trim,
  roofH = 0.34,
  flag = false,
  flagColor = TOY.ember,
  windows = 1,
  windowYaw = 0,
}: {
  p: Vec3;
  rBody?: number;
  h?: number;
  body?: string;
  cap?: string;
  roof?: string;
  trim?: string;
  roofH?: number;
  flag?: boolean;
  flagColor?: string;
  windows?: number;
  windowYaw?: number;
}) {
  const wins = [];
  for (let i = 0; i < windows; i++) {
    const yaw = windowYaw + i * 1.15;
    wins.push(
      <ToyWindow
        key={i}
        p={[Math.sin(yaw) * (rBody + 0.005), h * (0.62 - i * 0.28), Math.cos(yaw) * (rBody + 0.005)]}
        rotY={yaw}
        s={Math.min(1, rBody * 5.4)}
        frame={cap}
      />,
    );
  }
  // Scattered brick seams around the drum so the masonry reads up close.
  const bricks = [];
  for (let i = 0; i < 6; i++) {
    const yaw = Math.sin(rBody * 97 + i * 41) * Math.PI * 2;
    const by = h * (0.18 + 0.6 * (Math.sin(rBody * 31 + i * 23) * 0.5 + 0.5));
    bricks.push(
      <BoxT
        key={`b${i}`}
        p={[Math.sin(yaw) * (rBody + 0.004), by, Math.cos(yaw) * (rBody + 0.004)]}
        r={[0, yaw, 0]}
        size={[0.05, 0.026, 0.014]}
        color={cap}
      />,
    );
  }
  return (
    <group position={p}>
      {/* Foundation course rooting the tower. */}
      <CylT p={[0, 0.05, 0]} rTop={rBody * 1.16} rBot={rBody * 1.24} h={0.1} color={TOY.stone} seg={20} />
      <CylT p={[0, h / 2, 0]} rTop={rBody} rBot={rBody * 1.12} h={h} color={body} seg={20} />
      {/* Masonry band partway up, like a mortar course. */}
      <CylT p={[0, h * 0.36, 0]} rTop={rBody * 1.09} rBot={rBody * 1.11} h={0.035} color={cap} seg={20} />
      <CylT p={[0, h + 0.025, 0]} rTop={rBody * 1.22} rBot={rBody * 1.22} h={0.06} color={cap} seg={20} />
      <ShingleRoof p={[0, h + 0.055, 0]} radius={rBody * 1.3} h={roofH} color={roof} trim={trim} />
      {flag && <Pennant p={[0, h + 0.055 + roofH * 0.92, 0]} color={flagColor} />}
      {wins}
      {bricks}
    </group>
  );
}
