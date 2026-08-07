import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Box3, MathUtils, Vector3, type Mesh } from "three";
import {
  mergeVertices,
  toCreasedNormals,
} from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Sculpted-asset sanctuary: a real castle mesh (CC0, CreativeTrio via
 * Poly Pizza) instead of kit-bashed primitives. The source is faceted
 * low-poly, so each mesh is welded and given creased normals at load —
 * curved surfaces (tower drums, cones) shade smooth while walls and
 * battlements keep their crisp planes. The brand frost/gradient finish
 * is applied by AtlasSanctuary on top.
 */
const CITADEL_URL = "/models/citadel.glb";

/** Footprint in diorama units, matching the procedural models' bases. */
const FOOTPRINT = 2.4;

export function CitadelModel() {
  const { scene } = useGLTF(CITADEL_URL);

  const model = useMemo(() => {
    const root = scene.clone(true);
    root.traverse((o) => {
      const mesh = o as Mesh;
      if (!mesh.isMesh) return;
      let geo = mesh.geometry.index
        ? mesh.geometry.toNonIndexed()
        : mesh.geometry.clone();
      geo = mergeVertices(geo, 1e-4);
      // Smooth shading across shallow edges (tower drums, cones) while
      // keeping true corners crisp.
      geo = toCreasedNormals(geo, MathUtils.degToRad(42));
      mesh.geometry = geo;
    });

    // Normalize: known footprint, grounded at y=0, centered on the pin.
    const box = new Box3().setFromObject(root);
    const size = box.getSize(new Vector3());
    root.scale.setScalar(FOOTPRINT / Math.max(size.x, size.z));
    box.setFromObject(root);
    const center = box.getCenter(new Vector3());
    root.position.set(-center.x, -box.min.y, -center.z);
    return root;
  }, [scene]);

  return <primitive object={model} />;
}

useGLTF.preload(CITADEL_URL);
