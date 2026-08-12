import {
  VAULT_DOCUMENTS,
  VAULT_ROOMS,
  type VaultDocument,
  type VaultRoom,
} from "./vault";

/* ---------------------------------------------------------------------------
 * Readiness, grouped into the sections an application actually asks for.
 *
 * Six flat documents told you what you had; they didn't tell you what it was
 * for. Grouping by section does: identity unlocks a different set of programs
 * than proof of ownership, and someone with neither is stuck regardless of how
 * many photos of the living room they've taken.
 *
 * Sections are defined over the existing documents and rooms rather than
 * duplicating them, so nothing here can drift from the vault.
 *
 * SAMPLE DATA: the "unlocks N programs" counts are illustrative.
 * ------------------------------------------------------------------------- */

export type SectionStatus = "complete" | "started" | "empty";

export interface SectionItem {
  name: string;
  meta: string;
  done: boolean;
}

export interface ReadinessSection {
  id: string;
  name: string;
  sub: string;
  items: SectionItem[];
  done: number;
  total: number;
  status: SectionStatus;
}

/** Which documents belong to which section. */
const DOC_SECTIONS: { id: string; name: string; sub: string; docs: string[] }[] =
  [
    {
      id: "identity",
      name: "Identity documents",
      sub: "Proves who you are · unlocks 7 programs",
      docs: ["id"],
    },
    {
      id: "ownership",
      name: "Property ownership",
      sub: "Deed and utility bill · unlocks 5 programs",
      docs: ["deed", "utility"],
    },
    {
      id: "insurance",
      name: "Insurance documents",
      sub: "Declarations pages and mortgage statement",
      docs: ["policy", "mortgage", "appraisal"],
    },
  ];

function statusOf(done: number, total: number): SectionStatus {
  if (total > 0 && done >= total) return "complete";
  return done > 0 ? "started" : "empty";
}

export function buildSections(
  documents: VaultDocument[],
  rooms: VaultRoom[],
): ReadinessSection[] {
  const sections: ReadinessSection[] = DOC_SECTIONS.map((s) => {
    const docs = s.docs
      .map((id) => documents.find((d) => d.id === id))
      .filter((d): d is VaultDocument => Boolean(d));
    const items: SectionItem[] = docs.map((d) => ({
      name: d.name,
      /* Pending and missing documents carry no meta line in the vault data. */
      meta: d.meta ?? (d.status === "missing" ? "Not added" : "Verifying"),
      done: d.status === "verified",
    }));
    const done = items.filter((i) => i.done).length;
    return { ...s, items, done, total: items.length, status: statusOf(done, items.length) };
  });

  /* The home inventory is one section, counted by room rather than by item —
     a room with nothing in it is the thing that needs doing, and counting 32
     individual objects would bury that. */
  const roomItems = rooms.map((r) => ({
    name: r.name,
    meta:
      r.items.length === 0
        ? "Nothing documented yet"
        : `${r.items.length} items · ${r.items.filter((i) => i.photo).length} with photos`,
    done: r.items.length > 0,
  }));
  const roomsDone = roomItems.filter((i) => i.done).length;

  sections.push({
    id: "assets",
    name: "Asset library: home",
    sub: "Room by room, documented and valued",
    items: roomItems,
    done: roomsDone,
    total: roomItems.length,
    status: statusOf(roomsDone, roomItems.length),
  });

  /* Two sections with nothing behind them yet. They're shown rather than
     hidden because an empty section is information: these are the parts of a
     claim nobody thinks about until an adjuster asks. */
  sections.push({
    id: "access",
    name: "Home access",
    sub: "Codes, shutoffs and entry info",
    items: [
      { name: "Water and gas shutoff locations", meta: "Not added", done: false },
      { name: "Alarm codes and key holders", meta: "Not added", done: false },
    ],
    done: 0,
    total: 2,
    status: "empty",
  });

  sections.push({
    id: "vehicles",
    name: "Vehicles",
    sub: "Titles and photos needed",
    items: [
      { name: "Vehicle titles", meta: "Not added", done: false },
      { name: "Condition photos", meta: "Not added", done: false },
    ],
    done: 0,
    total: 2,
    status: "empty",
  });

  return sections;
}

/**
 * One readiness figure across everything: required documents plus every asset
 * that still needs documenting, counted as equal units.
 *
 * Deliberately a plain count rather than the weighted formula this replaced,
 * which split 55% documents and 45% rooms for no stated reason. A count is
 * something a person can check against what they see on screen.
 */
/**
 * The readiness figure, derived from the documents and rooms actually on file.
 *
 * Exported as a ready-made number so any view can show it without rebuilding
 * the sections first — the overview tile did not, and drifted to a hardcoded
 * 35 while this said 44.
 */
export function currentReadiness() {
  return readinessPercent(buildSections(VAULT_DOCUMENTS, VAULT_ROOMS));
}

export function readinessPercent(sections: ReadinessSection[]): {
  pct: number;
  done: number;
  total: number;
  docsDone: number;
  docsTotal: number;
  assetsDone: number;
  assetsTotal: number;
} {
  const docSections = sections.filter((s) =>
    ["identity", "ownership", "insurance"].includes(s.id),
  );
  const assetSections = sections.filter(
    (s) => !["identity", "ownership", "insurance"].includes(s.id),
  );

  const sum = (list: ReadinessSection[], k: "done" | "total") =>
    list.reduce((n, s) => n + s[k], 0);

  const docsDone = sum(docSections, "done");
  const docsTotal = sum(docSections, "total");
  const assetsDone = sum(assetSections, "done");
  const assetsTotal = sum(assetSections, "total");
  const done = docsDone + assetsDone;
  const total = docsTotal + assetsTotal;

  return {
    pct: total === 0 ? 0 : Math.round((done / total) * 100),
    done,
    total,
    docsDone,
    docsTotal,
    assetsDone,
    assetsTotal,
  };
}
