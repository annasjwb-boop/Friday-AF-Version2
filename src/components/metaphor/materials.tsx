import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSmoothedHomeState } from "./state";

/**
 * The shared material library: matte ceramic shell, satin trim, graphite
 * components, translucent acrylic glazing, pale wood, soft foliage, a warm
 * interior glow, and one restrained teal status accent. Every metaphor is
 * dressed exclusively from this set so the seven homes read as one family.
 */
export type HomeMaterials = {
  shell: THREE.MeshStandardMaterial;
  trim: THREE.MeshStandardMaterial;
  stone: THREE.MeshStandardMaterial;
  dark: THREE.MeshStandardMaterial;
  wood: THREE.MeshStandardMaterial;
  plant: THREE.MeshStandardMaterial;
  glow: THREE.MeshStandardMaterial;
  accent: THREE.MeshStandardMaterial;
  glassWarm: THREE.MeshPhysicalMaterial;
  glassCool: THREE.MeshPhysicalMaterial;
};

export const ACCENT_TEAL = "#1fb6a2";

const SHELL_CLEAN = new THREE.Color("#f4f2ed");
const SHELL_DUSTY = new THREE.Color("#ddd6ca");

/** Very subtle low-contrast grain so wood reads as material, not texture. */
function makeWoodTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#dcc6a2";
  ctx.fillRect(0, 0, 256, 256);
  // Seeded LCG keeps the grain stable across remounts.
  let seed = 41;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 30; i += 1) {
    const x = rand() * 256;
    const width = 1.5 + rand() * 4;
    const drift = (rand() - 0.5) * 14;
    ctx.strokeStyle = `rgba(178, 149, 108, ${0.1 + rand() * 0.12})`;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x, -8);
    ctx.bezierCurveTo(x + drift, 90, x - drift, 170, x + drift * 0.6, 264);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function createMaterials(): HomeMaterials {
  const shell = new THREE.MeshStandardMaterial({
    color: SHELL_CLEAN.clone(),
    roughness: 0.72,
    metalness: 0,
    envMapIntensity: 0.55,
  });

  const trim = new THREE.MeshStandardMaterial({
    color: "#d8d2c6",
    roughness: 0.5,
    metalness: 0,
    envMapIntensity: 0.7,
  });

  const stone = new THREE.MeshStandardMaterial({
    color: "#c7c1b6",
    roughness: 0.85,
    metalness: 0,
    envMapIntensity: 0.4,
  });

  const dark = new THREE.MeshStandardMaterial({
    color: "#383b40",
    roughness: 0.52,
    metalness: 0,
    envMapIntensity: 0.6,
  });

  const wood = new THREE.MeshStandardMaterial({
    map: makeWoodTexture(),
    color: "#f3e6d0",
    roughness: 0.78,
    metalness: 0,
    envMapIntensity: 0.35,
  });

  const plant = new THREE.MeshStandardMaterial({
    color: "#8ba888",
    roughness: 0.9,
    metalness: 0,
    envMapIntensity: 0.3,
  });

  // Warm interior light planes behind glazing; intensity is state-driven and
  // can rise past 1 so only these surfaces catch the bloom pass.
  const glow = new THREE.MeshStandardMaterial({
    color: "#ffe3b8",
    emissive: "#ffb35e",
    emissiveIntensity: 0.8,
    roughness: 0.6,
    metalness: 0,
  });

  const accent = new THREE.MeshStandardMaterial({
    color: ACCENT_TEAL,
    emissive: ACCENT_TEAL,
    emissiveIntensity: 0.6,
    roughness: 0.4,
    metalness: 0,
  });

  const glassWarm = new THREE.MeshPhysicalMaterial({
    color: "#f0cfa4",
    transmission: 0.72,
    roughness: 0.24,
    ior: 1.45,
    thickness: 0.5,
    metalness: 0,
    emissive: "#ffab55",
    emissiveIntensity: 0.25,
    envMapIntensity: 0.8,
  });

  const glassCool = new THREE.MeshPhysicalMaterial({
    color: "#d3e2df",
    transmission: 0.68,
    roughness: 0.3,
    ior: 1.45,
    thickness: 0.4,
    metalness: 0,
    envMapIntensity: 0.9,
  });

  return {
    shell,
    trim,
    stone,
    dark,
    wood,
    plant,
    glow,
    accent,
    glassWarm,
    glassCool,
  };
}

const MaterialsContext = createContext<HomeMaterials | null>(null);

export function MaterialsProvider({ children }: { children: ReactNode }) {
  const materials = useMemo(createMaterials, []);

  useEffect(() => {
    return () => {
      for (const material of Object.values(materials)) {
        material.map?.dispose();
        material.dispose();
      }
    };
  }, [materials]);

  return (
    <MaterialsContext.Provider value={materials}>
      <MaterialsUpdater />
      {children}
    </MaterialsContext.Provider>
  );
}

export function useHomeMaterials(): HomeMaterials {
  const context = useContext(MaterialsContext);
  if (!context) {
    throw new Error("useHomeMaterials must be used within MaterialsProvider");
  }
  return context;
}

/**
 * Translates the smoothed state parameters into the shared materials each
 * frame: interior warmth, accent strength, window opacity, and surface
 * cleanliness. Geometry never changes — only light and finish.
 */
function MaterialsUpdater() {
  const materials = useContext(MaterialsContext);
  const smoothed = useSmoothedHomeState();

  useFrame(() => {
    if (!materials) return;
    const s = smoothed.current;

    // Interior light: preparedness and recovery warm the home; active risk
    // and structural damage dim it. Peaks above 1 so bloom stays selective.
    const warmth = THREE.MathUtils.clamp(
      0.35 +
        s.preparedness * 0.85 +
        s.recoveryProgress * 0.3 -
        s.activeRisk * 0.3 -
        (1 - s.structuralIntegrity) * 0.25,
      0.12,
      1.35,
    );
    materials.glow.emissiveIntensity = warmth * 1.5;
    materials.glassWarm.emissiveIntensity = 0.1 + warmth * 0.55;

    // Accent seams and guidance lines follow coverage strength.
    materials.accent.emissiveIntensity = 0.25 + s.coverageStrength * 1.5;

    // Active risk frosts the glazing (windows close up slightly).
    materials.glassWarm.transmission = 0.75 - s.activeRisk * 0.3;
    materials.glassCool.transmission = 0.7 - s.activeRisk * 0.28;

    // Surface cleanliness: low integrity dusts the ceramic shell down.
    materials.shell.color.lerpColors(
      SHELL_CLEAN,
      SHELL_DUSTY,
      (1 - s.structuralIntegrity) * 0.85,
    );
  });

  return null;
}
