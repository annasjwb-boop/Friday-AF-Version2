import type { VaultItem, VaultRoom } from "./vault";

/* ---------------------------------------------------------------------------
 * Carrying a scan out of onboarding and into the app.
 *
 * The onboarding flow and the vault are separate screens with no shared state,
 * so a scan done during onboarding would otherwise be described and then
 * thrown away — the person would arrive at their vault and find it empty,
 * which is worse than never offering the scan.
 *
 * localStorage is the bridge because there's no backend. It means the items
 * are real for this browser and nowhere else, which is the same limitation
 * every other stored thing in this prototype has.
 * ------------------------------------------------------------------------- */

const KEY = "aidfinder:scanned-items";

/** Items keyed by the vault room they belong to. */
export type ScannedItems = Record<string, VaultItem[]>;

export function loadScanned(): ScannedItems {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as ScannedItems;
  } catch {
    return {};
  }
}

export function addScanned(roomId: string, items: VaultItem[]) {
  const all = loadScanned();
  all[roomId] = [...(all[roomId] ?? []), ...items];
  localStorage.setItem(KEY, JSON.stringify(all));
  window.dispatchEvent(new Event("scanned-items"));
}

export function clearScanned() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("scanned-items"));
}

/**
 * Merge scanned items into the vault's rooms.
 *
 * Items go into the room they were scanned from; a scan of somewhere the vault
 * doesn't know about creates the room, the same way the voice walkthrough
 * already does for the dining room.
 */
export function withScanned(rooms: VaultRoom[]): VaultRoom[] {
  const scanned = loadScanned();
  if (Object.keys(scanned).length === 0) return rooms;

  const next = rooms.map((room) =>
    scanned[room.id]
      ? {
          ...room,
          videoCount: (room.videoCount ?? 0) + 1,
          items: [...room.items, ...scanned[room.id]],
        }
      : room,
  );

  for (const [roomId, items] of Object.entries(scanned)) {
    if (next.some((r) => r.id === roomId)) continue;
    next.push({
      id: roomId,
      name: roomId.charAt(0).toUpperCase() + roomId.slice(1),
      photoCount: 0,
      videoCount: 1,
      items,
    });
  }

  return next;
}
