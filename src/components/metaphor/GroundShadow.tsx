import { useEffect, useMemo } from "react";
import * as THREE from "three";

/**
 * The soft contact-shadow pool under the plinth: a baked radial-gradient
 * plane rather than drei's ContactShadows, whose per-frame shadow re-render
 * gets polluted by the postprocessing pipeline on a transparent canvas. A
 * static texture is immune, hugs the plinth from any rotation, and costs
 * nothing per frame.
 */
export function GroundShadow() {
  const texture = useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    // The plinth hides the center, so density holds until just past its
    // footprint and then falls away smoothly.
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.9)");
    gradient.addColorStop(0.72, "rgba(255, 255, 255, 0.38)");
    gradient.addColorStop(0.9, "rgba(255, 255, 255, 0.07)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
  }, []);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh position={[0, -0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[4.9, 4.9]} />
      <meshBasicMaterial
        color="#403a31"
        alphaMap={texture}
        transparent
        opacity={0.3}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
