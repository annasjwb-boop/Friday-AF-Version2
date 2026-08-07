import type { Sanctuary, SanctuaryId } from "../types/sanctuary";

export const SANCTUARIES: Sanctuary[] = [
  {
    id: "castle",
    name: "The Castle",
    description:
      "A symbol of everything you’ve built and everything worth protecting.",
    descriptor: "Proud and enduring",
    heroYaw: -0.4,
    framing: 1.12,
    shadowY: 0,
  },
  {
    id: "crystal",
    name: "The Crystal Sanctuary",
    description: "A quiet stronghold grown from light, kept apart and whole.",
    descriptor: "Private and resilient",
    heroYaw: 0.3,
    framing: 1.02,
    shadowY: 0,
  },
  {
    id: "mountain",
    name: "The Mountain Stronghold",
    description: "Carved into the rock. It does not move for weather or time.",
    descriptor: "Grounded and immovable",
    heroYaw: 0.3,
    framing: 1.08,
    shadowY: 0,
  },
  {
    id: "island",
    name: "The Island Fortress",
    description: "Held apart by water, complete within its own shores.",
    descriptor: "Protected and self-contained",
    heroYaw: -0.3,
    framing: 1.08,
    shadowY: 0,
  },
  {
    id: "sky",
    name: "The Sky Citadel",
    description: "Raised above the storm line, held together by intention.",
    descriptor: "Elevated and visionary",
    heroYaw: 0.3,
    framing: 1.05,
    shadowY: 0,
  },
];

export function getSanctuary(id: SanctuaryId): Sanctuary {
  return SANCTUARIES.find((s) => s.id === id) ?? SANCTUARIES[0];
}
