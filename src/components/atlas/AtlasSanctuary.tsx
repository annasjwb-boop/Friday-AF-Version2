import { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  BufferAttribute,
  CanvasTexture,
  Color,
  Matrix3,
  Matrix4,
  MeshPhysicalMaterial,
  PMREMGenerator,
  RepeatWrapping,
  Vector3,
  type Group,
  type Mesh,
  type MeshStandardMaterial,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { AtlasModel, type AtlasModelId } from "./models/AtlasModel";

/** The "this place is yours" glow painted under the diorama. */
const HALO = "#ffb15c";

/**
 * The brand gradient every sanctuary wears — amber at the ground rising
 * through coral and violet to blue at the spires, the same luminous ramp
 * across all five models so they read as one family.
 */
const BRAND_STOPS: { t: number; color: Color }[] = [
  { t: 0, color: new Color("#a84405") },
  { t: 0.28, color: new Color("#a8283c") },
  { t: 0.56, color: new Color("#571fa0") },
  { t: 0.9, color: new Color("#1747ad") },
  { t: 1, color: new Color("#1747ad") },
];

/**
 * Shared micro-grain bump: procedural speckle so every surface has clay
 * tooth instead of reading as smooth plastic. Generated once.
 */
let grainTexture: CanvasTexture | null = null;
function getGrainTexture(): CanvasTexture {
  if (grainTexture) return grainTexture;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  // Blobby stucco noise (not per-pixel static, which mipmaps away to
  // flat gray): overlapping soft discs at mixed radii keep structure at
  // every mip level so the tooth survives at map viewing distance.
  ctx.fillStyle = "rgb(128,128,128)";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 1400; i++) {
    const r = 1.5 + Math.random() * 5;
    const g = Math.round(112 + Math.random() * 34);
    ctx.fillStyle = `rgba(${g},${g},${g},0.5)`;
    ctx.beginPath();
    ctx.arc(Math.random() * size, Math.random() * size, r, 0, Math.PI * 2);
    ctx.fill();
  }
  grainTexture = new CanvasTexture(canvas);
  grainTexture.wrapS = RepeatWrapping;
  grainTexture.wrapT = RepeatWrapping;
  grainTexture.repeat.set(3, 3);
  // Without anisotropy the grain blurs away on the mostly-oblique walls.
  grainTexture.anisotropy = 8;
  return grainTexture;
}

function sampleBrand(t: number, out: Color) {
  const s = Math.min(1, Math.max(0, t));
  for (let i = 1; i < BRAND_STOPS.length; i++) {
    if (s <= BRAND_STOPS[i].t) {
      const a = BRAND_STOPS[i - 1];
      const b = BRAND_STOPS[i];
      out.copy(a.color).lerp(b.color, (s - a.t) / (b.t - a.t));
      return;
    }
  }
  out.copy(BRAND_STOPS[BRAND_STOPS.length - 1].color);
}

/**
 * Frosted-glass brand finish. Bakes the gradient into per-vertex colors in
 * model-root space so it flows continuously across every piece (the mesh-
 * gradient look), scaled by each part's original luminance so masonry
 * detail — brick courses, trim, timber — still reads as tonal variation.
 * The material is a frosted skin (clearcoat + sheen + iridescence) over an
 * emissive core, so the color appears to glow from inside on the dark map.
 * Lit windows and flames are left untouched. Returns a restore function.
 */
function applyFrostFinish(root: Group): () => void {
  root.updateWorldMatrix(true, true);
  const rootInv = new Matrix4().copy(root.matrixWorld).invert();
  const meshes: Mesh[] = [];
  root.traverse((o) => {
    if ((o as Mesh).isMesh) meshes.push(o as Mesh);
  });

  const skip = (m: Mesh) => {
    if (Array.isArray(m.material)) return true;
    const mat = m.material as MeshStandardMaterial;
    return !!mat.emissive && mat.emissive.r + mat.emissive.g + mat.emissive.b > 0.01;
  };

  // First pass: the model's vertical extent in root space.
  const toRoot = new Matrix4();
  const v = new Vector3();
  let minY = Infinity;
  let maxY = -Infinity;
  for (const m of meshes) {
    if (skip(m)) continue;
    toRoot.multiplyMatrices(rootInv, m.matrixWorld);
    const pos = m.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(toRoot);
      if (v.y < minY) minY = v.y;
      if (v.y > maxY) maxY = v.y;
    }
  }
  const range = Math.max(0.001, maxY - minY);

  // Second pass: bake gradient x luminance x baked occlusion into vertex
  // colors. Real shadow mapping doesn't survive the maplibre GL pipeline,
  // so occlusion is baked instead: every part darkens toward its own base
  // (contact shading against whatever it sits on) and on downward-facing
  // surfaces (under eaves, overhangs, battlement gaps). That's what makes
  // the kit pieces read as carved detail instead of flat color.
  const restore: (() => void)[] = [];
  const grad = new Color();
  const emissive = new Color();
  const normalToRoot = new Matrix3();
  const n = new Vector3();
  for (const m of meshes) {
    if (skip(m)) continue;
    const orig = m.material as MeshStandardMaterial;
    const hsl = { h: 0, s: 0, l: 0 };
    orig.color.getHSL(hsl);
    // Original lightness becomes a tone multiplier: dark oak and iron stay
    // dark inside the gradient, limestone stays bright. Wide range so parts
    // contrast against each other, scaled down so the finish stays deep.
    const tone = Math.min(1, Math.max(0.24, hsl.l / 0.5)) * 0.4;

    toRoot.multiplyMatrices(rootInv, m.matrixWorld);
    normalToRoot.getNormalMatrix(toRoot);
    const pos = m.geometry.attributes.position;
    const nor = m.geometry.attributes.normal;

    // This part's own vertical extent, for contact shading at its base.
    let partMinY = Infinity;
    let partMaxY = -Infinity;
    const rootY = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(toRoot);
      rootY[i] = v.y;
      if (v.y < partMinY) partMinY = v.y;
      if (v.y > partMaxY) partMaxY = v.y;
    }
    const band = Math.min(0.16, Math.max(0.03, (partMaxY - partMinY) * 0.45));

    const colors = new Float32Array(pos.count * 3);
    let ySum = 0;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(toRoot);
      ySum += v.y;

      // Contact occlusion: dark where the part meets its footing.
      const lift = Math.min(1, Math.max(0, (v.y - partMinY) / band));
      let ao = 0.52 + 0.48 * lift;
      // Downward-facing surfaces sit in their own shade.
      if (nor) {
        n.fromBufferAttribute(nor, i).applyMatrix3(normalToRoot);
        const down = Math.max(0, -n.y);
        ao *= 1 - down * 0.45;
      }

      // Slight lateral drift makes it a mesh gradient, not a strict ramp.
      const t = (v.y - minY) / range + v.x * 0.055 + v.z * 0.03;
      sampleBrand(t, grad);
      colors[i * 3] = Math.min(1, grad.r * tone * ao);
      colors[i * 3 + 1] = Math.min(1, grad.g * tone * ao);
      colors[i * 3 + 2] = Math.min(1, grad.b * tone * ao);
    }
    m.geometry.setAttribute("color", new BufferAttribute(colors, 3));

    sampleBrand((ySum / pos.count - minY) / range, emissive);
    emissive.multiplyScalar(tone);
    const frost = new MeshPhysicalMaterial({
      color: 0xffffff,
      vertexColors: true,
      roughness: 0.48,
      metalness: 0,
      // Clay tooth so light breaks up across every surface.
      bumpMap: getGrainTexture(),
      bumpScale: 1.4,
      // Frosted outer layer: a restrained satin clearcoat. Broad white
      // specular is what pushes the body toward pastel, so both the coat
      // and the base specular stay low.
      clearcoat: 0.3,
      clearcoatRoughness: 0.5,
      specularIntensity: 0.35,
      sheen: 0.08,
      sheenRoughness: 0.7,
      sheenColor: new Color("#cfd8ff"),
      // Just a hint of inner glow — shading carries the depth.
      emissive,
      emissiveIntensity: 0.12,
      envMapIntensity: 0.08,
    });
    m.material = frost;
    restore.push(() => {
      m.material = orig;
      frost.dispose();
      m.geometry.deleteAttribute("color");
    });
  }
  return () => {
    for (const f of restore) f();
  };
}

/**
 * Soft halo painted under the diorama so it reads as the selected place
 * on the basemap — the map-native "this is yours" glow — with a darker
 * core that seats the model instead of letting it float on the streets.
 */
function GroundHalo({ accent }: { accent: string }) {
  const texture = useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const shadow = ctx.createRadialGradient(128, 128, 0, 128, 128, 74);
    shadow.addColorStop(0, "rgba(4, 5, 8, 0.55)");
    shadow.addColorStop(1, "rgba(4, 5, 8, 0)");
    ctx.fillStyle = shadow;
    ctx.fillRect(0, 0, size, size);
    const halo = ctx.createRadialGradient(128, 128, 56, 128, 128, 128);
    halo.addColorStop(0, `${accent}00`);
    halo.addColorStop(0.62, `${accent}2e`);
    halo.addColorStop(1, `${accent}00`);
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, size, size);
    return new CanvasTexture(canvas);
  }, [accent]);

  return (
    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[5.4, 5.4]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}

/**
 * Neutral studio reflections for the painted-toy gloss. Generated locally
 * (RoomEnvironment), no HDR download.
 */
function StudioEnvironment() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const target = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = target.texture;
    return () => {
      scene.environment = null;
      target.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

/**
 * The home diorama standing at the home coordinate, in real map space:
 * `scale` converts the model's ~2.6-unit footprint into meters, and a
 * slow landmark turn keeps it alive without fighting map gestures.
 */
/**
 * Model plus finish, together inside the Suspense boundary: GLB-backed
 * models suspend while loading, and the finish must only run once their
 * meshes are actually mounted.
 */
function FinishedModel({ id }: { id: AtlasModelId }) {
  const model = useRef<Group>(null);
  useLayoutEffect(() => {
    if (!model.current) return;
    return applyFrostFinish(model.current);
  }, [id]);
  return (
    <group ref={model}>
      <AtlasModel id={id} />
    </group>
  );
}

export function AtlasSanctuary({
  id,
  scale,
  reducedMotion,
}: {
  id: AtlasModelId;
  /** Meters per diorama unit. */
  scale: number;
  reducedMotion: boolean;
}) {
  const spin = useRef<Group>(null);
  useFrame((_, dt) => {
    if (spin.current && !reducedMotion) spin.current.rotation.y += dt * 0.1;
  });

  return (
    <group scale={scale}>
      <StudioEnvironment />
      {/* Sculpting light: strong warm key for contrast, faint cool rim,
          low ambient so the shade sides stay deep. Cast shadows don't
          survive the maplibre GL pipeline, so occlusion is baked into the
          vertex colors instead (see applyFrostFinish). */}
      <hemisphereLight args={["#f4f0ff", "#241f2c", 0.12]} />
      <directionalLight color="#ffe9c9" position={[3.4, 5.6, 3.2]} intensity={1.7} />
      <directionalLight color="#8fa0ff" position={[-2.8, 3, -3.6]} intensity={0.22} />
      <GroundHalo accent={HALO} />
      <group ref={spin}>
        <Suspense fallback={null}>
          <FinishedModel id={id} />
        </Suspense>
      </group>
    </group>
  );
}
