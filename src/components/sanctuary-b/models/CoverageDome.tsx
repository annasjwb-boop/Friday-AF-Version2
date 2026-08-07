import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  type ShaderMaterial,
} from "three";

/**
 * The dome is a single gradient surface — no rims, no grid, no drawn
 * lines. Form comes from two cues: fresnel (invisible face-on, bright at
 * the silhouette) and a vertical gradient that anchors the field at the
 * ground and lets it dissolve toward the apex. The breach reads as a soft
 * feathered brightening toward the open edges rather than hard arcs.
 */
const DOME_VERT = /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vNormal = normalize(mat3(modelMatrix) * normal);
  vView = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const DOME_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uEdgeColor;
uniform float uTime;
uniform float uOpacity;
uniform float uEdgeGlow;
varying vec3 vNormal;
varying vec3 vView;
varying vec2 vUv;

void main() {
  float fres = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.4);
  // uv.y runs 0 at the apex to 1 at the base: the field is grounded below
  // and dissolves upward.
  float grad = pow(vUv.y, 1.6);
  // Soft feather toward the breach edges (uv.x 0 and 1), disabled when the
  // dome is unbroken so no seam shows at the back.
  float edge = max(
    smoothstep(0.07, 0.0, vUv.x),
    smoothstep(0.93, 1.0, vUv.x)
  ) * uEdgeGlow;
  float breathe = 0.9 + 0.1 * sin(uTime * 1.5);
  // A quiet glass shell: the cream field stays faint, and the theme's
  // accent appears only where the field is torn open at the breach.
  float a = (0.012 + fres * 0.22 + grad * 0.07 + edge * 0.3) * uOpacity * breathe;
  vec3 color = mix(uColor * (1.0 + 0.25 * grad), uEdgeColor, edge * 0.85);
  gl_FragColor = vec4(color, a);
}
`;

/** Shell tint: warm glass in the clay family, not a signal color. */
const SHELL = "#f4ecd9";

/**
 * The protective boundary as a force field: a fresnel-lit gradient energy
 * dome over the whole diorama, rendered as near-monochrome cream glass so
 * it shares the clay world's material language. The insured fraction maps
 * to how much of the dome exists — the uninsured remainder is a missing
 * wedge, always facing the camera, its open edges feathering into the
 * theme's accent. Below ~55% coverage the whole field turns unstable and
 * stutters; the gap and the stutter carry the alarm, not the color.
 */
export function CoverageDome({
  radius,
  y = 0.05,
  yScale = 1.2,
  covered,
  accent,
}: {
  radius: number;
  y?: number;
  /** Vertical stretch so the dome clears each silhouette's apex. */
  yScale?: number;
  /** 0..1 insured fraction of rebuild value. */
  covered: number;
  accent: string;
}) {
  const frac = Math.min(1, Math.max(0.05, covered));
  const full = frac >= 0.995;
  const gap = (1 - frac) * Math.PI * 2;
  // Sphere azimuth phi hits +z at PI/2, so centering the missing wedge on
  // the camera side is a symmetric start angle around that.
  const phiStart = Math.PI / 2 + gap / 2;
  const phiLength = Math.PI * 2 - gap;
  const unstable = frac < 0.55;

  const shieldMat = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uEdgeGlow: { value: 1 },
      uColor: { value: new Color(SHELL) },
      uEdgeColor: { value: new Color(accent) },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useFrame(({ clock }) => {
    if (!shieldMat.current) return;
    const t = clock.getElapsedTime();
    const u = shieldMat.current.uniforms;
    u.uTime.value = t;
    u.uEdgeColor.value.set(accent);
    u.uEdgeGlow.value = full ? 0 : 1;
    // A weak field stutters: brief dropouts instead of a steady glow.
    const flicker = unstable
      ? 0.55 + 0.45 * Math.abs(Math.sin(t * 6.1) * Math.sin(t * 2.3))
      : 1;
    u.uOpacity.value = (0.5 + frac * 0.5) * flicker;
  });

  return (
    <group position={[0, y, 0]} scale={[1, yScale, 1]}>
      <mesh>
        <sphereGeometry
          args={[radius, 64, 32, phiStart, phiLength, 0, Math.PI / 2]}
        />
        <shaderMaterial
          ref={shieldMat}
          vertexShader={DOME_VERT}
          fragmentShader={DOME_FRAG}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          side={DoubleSide}
          blending={AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
