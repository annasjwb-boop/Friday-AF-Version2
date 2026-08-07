import { VaultBody } from "../vault/VaultBody";
import "./CasitaReadiness.css";

/**
 * Casita's Readiness tab: the Readiness Vault, hosted inside Casita's sheet.
 *
 * Casita already provides the dark header, address, avatar, and tab strip, so
 * the vault contributes only its content — documented value, the next task,
 * documents, and the room-by-room inventory. The document, room, walkthrough,
 * and upload flows open as full-screen sheets over the top, exactly as they do
 * in the standalone variant.
 */
export function CasitaReadiness() {
  return (
    <div className="casita-readiness">
      <VaultBody />
    </div>
  );
}
