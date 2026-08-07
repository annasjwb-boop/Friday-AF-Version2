import { useMemo, useRef } from "react";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ACCENT_TEAL } from "./materials";
import { clamp01, smoothstep, useSmoothedHomeState } from "./state";
import { PLINTH_TOP } from "./Plinth";

const SEAM_INSET = 1.38;

/**
 * The shared state-driven dressing layer that sits on the plinth around
 * every metaphor: an accent perimeter seam (coverage), a lit approach path
 * (preparedness), corner guards (strong coverage), hairline cracks with a
 * displaced panel and light debris (low integrity), and repaired patches
 * (recovery). Everything is always mounted; only material opacity and
 * emissive strength move, so transitions stay soft and the object always
 * reads as the same maquette.
 */
export function StateDressing() {
  const smoothed = useSmoothedHomeState();

  const mats = useMemo(() => {
    const seam = new THREE.MeshStandardMaterial({
      color: ACCENT_TEAL,
      emissive: ACCENT_TEAL,
      emissiveIntensity: 0.4,
      roughness: 0.4,
      transparent: true,
      opacity: 0.6,
    });
    const path = new THREE.MeshStandardMaterial({
      color: "#cfe6e1",
      emissive: ACCENT_TEAL,
      emissiveIntensity: 0.2,
      roughness: 0.55,
      transparent: true,
      opacity: 0.9,
    });
    const guard = new THREE.MeshStandardMaterial({
      color: "#3d4a48",
      emissive: ACCENT_TEAL,
      emissiveIntensity: 0.5,
      roughness: 0.45,
      transparent: true,
      opacity: 0,
    });
    const crack = new THREE.MeshStandardMaterial({
      color: "#4d473d",
      roughness: 0.85,
      transparent: true,
      opacity: 0,
    });
    const debris = new THREE.MeshStandardMaterial({
      color: "#c9c2b5",
      roughness: 0.8,
      transparent: true,
      opacity: 0,
    });
    const patch = new THREE.MeshStandardMaterial({
      color: "#e6e1d6",
      emissive: ACCENT_TEAL,
      emissiveIntensity: 0.12,
      roughness: 0.6,
      transparent: true,
      opacity: 0,
    });
    return { seam, path, guard, crack, debris, patch };
  }, []);

  const crackGroup = useRef<THREE.Group>(null);
  const guardGroup = useRef<THREE.Group>(null);
  const patchGroup = useRef<THREE.Group>(null);

  useFrame(() => {
    const s = smoothed.current;

    // Damage reads only below ~75% integrity, and recovery sweeps it away.
    const damage =
      clamp01((0.75 - s.structuralIntegrity) / 0.75) *
      (1 - s.recoveryProgress * 0.75);

    mats.seam.opacity = 0.15 + s.coverageStrength * 0.8;
    mats.seam.emissiveIntensity = 0.2 + s.coverageStrength * 1.6;

    mats.path.emissiveIntensity = 0.1 + s.preparedness * 1.2;
    mats.path.opacity = 0.5 + s.preparedness * 0.5;

    const guardStrength = smoothstep(0.45, 0.95, s.coverageStrength);
    mats.guard.opacity = guardStrength;
    mats.guard.emissiveIntensity = 0.3 + guardStrength * 1.1;
    if (guardGroup.current) guardGroup.current.visible = guardStrength > 0.02;

    mats.crack.opacity = damage;
    mats.debris.opacity = damage * 0.95;
    if (crackGroup.current) crackGroup.current.visible = damage > 0.02;

    const repaired = smoothstep(0.12, 0.7, s.recoveryProgress);
    mats.patch.opacity = repaired * 0.95;
    mats.patch.emissiveIntensity = 0.08 + repaired * 0.35;
    if (patchGroup.current) patchGroup.current.visible = repaired > 0.02;
  });

  const top = PLINTH_TOP + 0.004;

  return (
    <group>
      {/* Coverage: accent perimeter seam inset on the plinth's top face. */}
      <group>
        <mesh material={mats.seam} position={[0, top, -SEAM_INSET]}>
          <boxGeometry args={[SEAM_INSET * 2, 0.012, 0.028]} />
        </mesh>
        <mesh material={mats.seam} position={[0, top, SEAM_INSET]}>
          <boxGeometry args={[SEAM_INSET * 2, 0.012, 0.028]} />
        </mesh>
        <mesh material={mats.seam} position={[-SEAM_INSET, top, 0]}>
          <boxGeometry args={[0.028, 0.012, SEAM_INSET * 2]} />
        </mesh>
        <mesh material={mats.seam} position={[SEAM_INSET, top, 0]}>
          <boxGeometry args={[0.028, 0.012, SEAM_INSET * 2]} />
        </mesh>
      </group>

      {/* Preparedness: the lit approach path to the entry. */}
      <RoundedBox
        args={[0.3, 0.014, 0.72]}
        radius={0.007}
        position={[0, top, 1.12]}
        material={mats.path}
      />

      {/* Strong coverage: four corner guards, like product-render brackets. */}
      <group ref={guardGroup}>
        {([
          [1, 1],
          [-1, 1],
          [1, -1],
          [-1, -1],
        ] as const).map(([sx, sz]) => (
          <group
            key={`${sx}${sz}`}
            position={[sx * 1.46, PLINTH_TOP, sz * 1.46]}
          >
            <RoundedBox
              args={[0.04, 0.46, 0.04]}
              radius={0.015}
              position={[0, 0.23, 0]}
              material={mats.guard}
            />
            <RoundedBox
              args={[0.26, 0.04, 0.04]}
              radius={0.015}
              position={[-sx * 0.12, 0.44, 0]}
              material={mats.guard}
            />
            <RoundedBox
              args={[0.04, 0.04, 0.26]}
              radius={0.015}
              position={[0, 0.44, -sz * 0.12]}
              material={mats.guard}
            />
          </group>
        ))}
      </group>

      {/* Low integrity: hairline cracks, one displaced panel, light debris. */}
      <group ref={crackGroup}>
        <mesh
          material={mats.crack}
          position={[0.68, top, 0.72]}
          rotation={[0, 0.5, 0]}
        >
          <boxGeometry args={[0.78, 0.006, 0.016]} />
        </mesh>
        <mesh
          material={mats.crack}
          position={[0.94, top, 0.42]}
          rotation={[0, -0.9, 0]}
        >
          <boxGeometry args={[0.42, 0.006, 0.013]} />
        </mesh>
        <mesh
          material={mats.crack}
          position={[-0.85, top, -0.6]}
          rotation={[0, 0.25, 0]}
        >
          <boxGeometry args={[0.5, 0.006, 0.014]} />
        </mesh>
        {/* Displaced panel resting against the plinth edge. */}
        <RoundedBox
          args={[0.3, 0.035, 0.2]}
          radius={0.012}
          position={[1.18, top + 0.03, 0.95]}
          rotation={[0.16, 0.6, 0.05]}
          material={mats.debris}
        />
        <RoundedBox
          args={[0.11, 0.07, 0.09]}
          radius={0.02}
          position={[-1.22, top + 0.035, 1.05]}
          rotation={[0, 0.8, 0]}
          material={mats.debris}
        />
        <RoundedBox
          args={[0.08, 0.05, 0.08]}
          radius={0.018}
          position={[1.3, top + 0.025, -0.9]}
          rotation={[0, -0.4, 0]}
          material={mats.debris}
        />
      </group>

      {/* Recovery: freshly repaired sections with a faint accent cast. */}
      <group ref={patchGroup}>
        <RoundedBox
          args={[0.46, 0.022, 0.3]}
          radius={0.01}
          position={[0.72, top + 0.006, 0.66]}
          rotation={[0, 0.5, 0]}
          material={mats.patch}
        />
        <RoundedBox
          args={[0.3, 0.022, 0.22]}
          radius={0.01}
          position={[-0.82, top + 0.006, -0.58]}
          rotation={[0, 0.2, 0]}
          material={mats.patch}
        />
      </group>
    </group>
  );
}
