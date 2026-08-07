import { readinessProgress, riskScore } from "../../data/home";

export const METAPHORS = [
  "sanctuary",
  "castle",
  "cabin",
  "greenhouse",
  "lighthouse",
  "bunker",
  "treehouse",
  "mountain",
  "sky",
  "solitude",
] as const;

export type MetaphorId = (typeof METAPHORS)[number];

/** Lowercase labels for alt text and inline copy. */
export const METAPHOR_LABELS: Record<MetaphorId, string> = {
  sanctuary: "sanctuary",
  castle: "castle",
  cabin: "cabin",
  greenhouse: "greenhouse",
  lighthouse: "lighthouse",
  bunker: "bunker",
  treehouse: "treehouse",
  mountain: "mountain home",
  sky: "sky building",
  solitude: "fortress of solitude",
};

export const METAPHOR_NAMES: Record<MetaphorId, string> = {
  sanctuary: "The Sanctuary",
  castle: "The Castle",
  cabin: "The Cabin",
  greenhouse: "The Greenhouse",
  lighthouse: "The Lighthouse",
  bunker: "The Bunker",
  treehouse: "The Treehouse",
  mountain: "The Mountain Home",
  sky: "The Sky Citadel",
  solitude: "The Fortress of Solitude",
};

/*
 * Each story is one line of metaphor voice plus one line that points back
 * at the member's real numbers. Recovery figures mirror the Recovery tab.
 */
const risk = riskScore.value;
const zone = riskScore.label;
const delta = Math.abs(riskScore.delta ?? 0);
const ready = readinessProgress;
const fund = "$18,200";
const funded = "45%";

export const METAPHOR_STORIES: Record<MetaphorId, string> = {
  sanctuary: `A calm plot that keeps the world at arm's length. Right now your sanctuary scores ${risk} — ${zone} — and the flood gap is what lets the noise in. Close it, and the calm gets real.`,
  castle: `Thick walls and high towers, but every castle is judged by its defenses. At ${ready}% aid readiness the gates are still open — finish the checklist and raise the drawbridge.`,
  cabin: `Warm light, wood smoke, everything you need and nothing more. Your recovery fund holds ${fund} — ${funded} of the plan, stacked like firewood before a hard winter.`,
  greenhouse: `A home built to grow things back after a bad season. You're at ${ready}% readiness and climbing — every task you finish is another bed planted before the storm.`,
  lighthouse: `Built to stand where the weather hits first. A ${risk} risk score means the beam found something: flood coverage is your dark stretch of coast.`,
  bunker: `Over-prepared on purpose, and proud of it. You're ${ready}% ready — and a real bunker doesn't stop at a third of the checklist.`,
  treehouse: `Above it all, held up by something older and stronger than you. Rising water can't reach you up here — but your policy can't say the same. Flood is the branch to shore up.`,
  mountain: `Carved into the slope, patient as stone. Your risk score fell ${delta} points last month — keep chipping away and the mountain does the rest.`,
  sky: `A home floating above the weather entirely. Down at ground level your score still reads ${risk} — ${zone}. The higher you want to float, the stronger the anchor has to be.`,
  solitude: `Concrete quiet, built to outlast everything. Its one soft spot: a recovery plan that's only ${funded} funded. Even fortresses keep reserves.`,
};
