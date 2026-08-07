import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  Color,
  NormalBlending,
  Vector3,
  type Group,
  type MeshStandardMaterial,
  type ShaderMaterial,
} from "three";

type Vec3 = [number, number, number];

/**
 * One GPU particle system for all the weather in the dioramas. Every
 * particle's full trajectory is computed in the vertex shader from a random
 * seed — spawn inside a box, travel along a base direction with turbulent
 * wander, grow and fade over its life — so smoke, rain, and wind debris
 * are the same component with different parameters and zero per-frame CPU
 * work.
 */
const VERT = /* glsl */ `
attribute vec3 aSeed;
uniform float uTime;
uniform float uSpeed;
uniform vec3 uDir;
uniform float uDist;
uniform vec3 uSpread;
uniform float uSize0;
uniform float uSize1;
uniform float uTurb;
varying float vFade;

void main() {
  float rate = 0.7 + aSeed.x * 0.6;
  float life = fract(uTime * uSpeed * rate + aSeed.y * 7.13);
  vec3 spawn = (aSeed - 0.5) * 2.0 * uSpread;
  vec3 pos = spawn + uDir * life * uDist;
  pos.x += sin(life * 9.4 + aSeed.z * 40.0) * uTurb * (0.3 + life);
  pos.z += cos(life * 7.1 + aSeed.x * 40.0) * uTurb * 0.6 * (0.3 + life);
  vFade = smoothstep(0.0, 0.12, life) * (1.0 - smoothstep(0.6, 1.0, life));
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  float size = (uSize0 + uSize1 * life) * (0.7 + aSeed.z * 0.6);
  gl_PointSize = size * (240.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`;

const FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying float vFade;

void main() {
  float d = length(gl_PointCoord - 0.5);
  float disk = smoothstep(0.5, 0.14, d);
  float a = disk * vFade * uOpacity;
  if (a < 0.004) discard;
  gl_FragColor = vec4(uColor, a);
}
`;

export function ParticleDrift({
  p = [0, 0, 0],
  count = 80,
  dir,
  dist,
  spread,
  size,
  speed,
  turbulence = 0.06,
  color,
  opacity,
  additive = false,
}: {
  p?: Vec3;
  count?: number;
  /** Base travel direction (unnormalized — its length shapes the drift). */
  dir: Vec3;
  /** How far a particle travels over one life. */
  dist: number;
  /** Half-extents of the spawn box. */
  spread: Vec3;
  /** [size at birth, extra size gained over life]. */
  size: [number, number];
  /** Life cycles per second (0.5 = two-second life). */
  speed: number;
  turbulence?: number;
  color: string;
  opacity: number;
  additive?: boolean;
}) {
  const mat = useRef<ShaderMaterial>(null);
  const opacityRef = useRef(opacity);
  opacityRef.current = opacity;

  const { positions, seeds } = useMemo(() => {
    const s = new Float32Array(count * 3);
    for (let i = 0; i < s.length; i++) s[i] = Math.random();
    return { positions: new Float32Array(count * 3), seeds: s };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSpeed: { value: speed },
      uDir: { value: new Vector3(...dir) },
      uDist: { value: dist },
      uSpread: { value: new Vector3(...spread) },
      uSize0: { value: size[0] },
      uSize1: { value: size[1] },
      uTurb: { value: turbulence },
      uColor: { value: new Color(color) },
      uOpacity: { value: opacity },
    }),
    // Trajectory parameters are fixed per mount; only time/opacity animate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useFrame(({ clock }) => {
    if (!mat.current) return;
    mat.current.uniforms.uTime.value = clock.getElapsedTime();
    mat.current.uniforms.uOpacity.value = opacityRef.current;
  });

  return (
    <points position={p} frustumCulled={false}>
      <bufferGeometry key={count}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 3]} />
      </bufferGeometry>
      <shaderMaterial
        ref={mat}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={additive ? AdditiveBlending : NormalBlending}
      />
    </points>
  );
}

/** One health point: a camera-facing red cross rising on its own loop. */
function HealCross({
  center,
  radius,
  height,
  phase,
  speed,
  angle0,
}: {
  center: Vec3;
  radius: number;
  height: number;
  phase: number;
  speed: number;
  angle0: number;
}) {
  const group = useRef<Group>(null);
  const matA = useRef<MeshStandardMaterial>(null);
  const matB = useRef<MeshStandardMaterial>(null);

  useFrame(({ clock, camera }) => {
    const g = group.current;
    if (!g) return;
    const t = clock.getElapsedTime();
    const cycle = (t * speed + phase) % 1;
    const a = angle0 + t * 0.12;
    g.position.set(
      center[0] + Math.cos(a) * radius,
      center[1] + cycle * height,
      center[2] + Math.sin(a) * radius,
    );
    // Billboard so the cross always reads as a cross.
    g.quaternion.copy(camera.quaternion);
    const fade =
      Math.min(1, cycle / 0.15) *
      Math.max(0, 1 - Math.max(0, (cycle - 0.68) / 0.32));
    g.scale.setScalar(0.85 + 0.25 * Math.sin(cycle * Math.PI));
    if (matA.current) matA.current.opacity = fade * 0.95;
    if (matB.current) matB.current.opacity = fade * 0.95;
  });

  const bar = (
    ref: typeof matA,
    size: [number, number, number],
    key: string,
  ) => (
    <mesh key={key}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        ref={ref}
        color="#5c2408"
        emissive="#ff5f4d"
        emissiveIntensity={1.7}
        roughness={0.5}
        transparent
        opacity={0}
        depthWrite={false}
      />
    </mesh>
  );

  return (
    <group ref={group}>
      {bar(matA, [0.1, 0.032, 0.02], "h")}
      {bar(matB, [0.032, 0.1, 0.02], "v")}
    </group>
  );
}

/**
 * The recovering state's healing effect: small red-cross health points
 * spiraling slowly up around the sanctuary, each pulsing in and fading
 * out on its own staggered loop — the sanctuary is regaining HP.
 */
export function HealingCrosses({
  p = [0, 0, 0],
  radius = 0.9,
  height = 1.1,
  count = 7,
}: {
  p?: Vec3;
  radius?: number;
  height?: number;
  count?: number;
}) {
  return (
    <group>
      {Array.from({ length: count }, (_, i) => (
        <HealCross
          key={i}
          center={p}
          radius={radius * (0.72 + ((i * 37) % 100) / 320)}
          height={height}
          phase={i / count}
          speed={0.2 + (i % 3) * 0.035}
          angle0={(i / count) * Math.PI * 2}
        />
      ))}
    </group>
  );
}

