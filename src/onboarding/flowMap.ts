import {
  AD_TO_SCRIPT,
  NO_STORMS,
  SCRIPTS,
  type Script,
  type Step,
} from "./scripts";

/* ---------------------------------------------------------------------------
 * Walking a flow.
 *
 * One implementation, used by the CLI generator and by the in-app view, so a
 * diagram can't disagree with the checker or with the flow itself.
 *
 * The branch labels below are the one thing here not read from the scripts —
 * they live in the step components. Keeping them in a single exported table
 * means there's exactly one place to correct when a button's wording changes,
 * rather than a copy in the generator and another in the view.
 * ------------------------------------------------------------------------- */

export const BRANCH_LABELS: Record<string, string[]> = {
  confirmAddress: ["Yes, that's my home", "That's not my address"],
  askAddress: ["address entered"],
  pickGrants: ["one or more storms", "neither damaged my home"],
  resiliency: ["Yes interested", "Maybe — save for now", "Not right now"],
  insurance: [
    "Connect my policy",
    "Upload my declarations page",
    "I don't carry insurance",
  ],
  morePolicies: [
    "Another property policy",
    "My vehicle policy",
    "That's everything",
  ],
  moreDocs: ["Add another document", "That's enough for now"],
  uploadDoc: ["document added"],
};

export interface Edge {
  /** What the person did. Null for steps that simply advance. */
  on: string | null;
  /** Destination index, or null if the flow ends or goes nowhere. */
  to: number | null;
  exit?: boolean;
  broken?: boolean;
}

/** One resolved form of a step whose copy or timing depends on an answer. */
export interface Variant {
  /** What produces this form, e.g. `storms = Neither of these damaged…`. */
  when: string;
  text?: string;
  pause?: number;
}

export interface Node {
  index: number;
  step: Step;
  label?: string;
  pause?: number;
  summary: string;
  edges: Edge[];
  reachable: boolean;
  /** Populated when the step's text or pause is a function of the answers. */
  variants: Variant[];
}

export interface FlowReport {
  id: string;
  source: string;
  ads: string[];
  nodes: Node[];
  problems: string[];
  reachable: number;
  total: number;
}

const labelIndex = (steps: Step[], label: string) =>
  steps.findIndex((s) => s.label === label);

export function edgesOf(steps: Step[], i: number): Edge[] {
  const s = steps[i];
  const next = i + 1 < steps.length ? i + 1 : null;
  const at = (label: string): Edge["to"] => {
    const n = labelIndex(steps, label);
    return n < 0 ? null : n;
  };

  switch (s.kind) {
    case "goto":
      return [{ on: null, to: null, exit: true }];
    case "confirmAddress": {
      const [yes, no] = BRANCH_LABELS.confirmAddress;
      return [
        { on: yes, to: at(s.okTo), broken: labelIndex(steps, s.okTo) < 0 },
        { on: no, to: at(s.retryTo), broken: labelIndex(steps, s.retryTo) < 0 },
      ];
    }
    case "askAddress":
      return [
        {
          on: BRANCH_LABELS.askAddress[0],
          to: at(s.backTo),
          broken: labelIndex(steps, s.backTo) < 0,
        },
      ];
    case "moreDocs": {
      const [again, done] = BRANCH_LABELS.moreDocs;
      return [
        {
          on: again,
          to: at(s.againTo),
          broken: labelIndex(steps, s.againTo) < 0,
        },
        {
          on: done,
          to: at(s.doneTo),
          broken: labelIndex(steps, s.doneTo) < 0,
        },
      ];
    }
    case "morePolicies": {
      const [again, vehicle, done] = BRANCH_LABELS.morePolicies;
      const loop = labelIndex(steps, s.againTo) < 0;
      const end = labelIndex(steps, s.doneTo) < 0;
      return [
        { on: again, to: at(s.againTo), broken: loop },
        { on: vehicle, to: at(s.againTo), broken: loop },
        { on: done, to: at(s.doneTo), broken: end },
      ];
    }
    case "choice":
      return s.options
        .concat(s.other ? ["Something else (free text)"] : [])
        .map((o) => {
          const target = s.branch?.[o];
          if (!target) return { on: o, to: next };
          return {
            on: o,
            to: at(target),
            broken: labelIndex(steps, target) < 0,
          };
        });
    case "pickGrants":
    case "resiliency":
    case "insurance":
      return BRANCH_LABELS[s.kind].map((on) => ({ on, to: next }));
    default:
      return [{ on: null, to: next }];
  }
}

/**
 * What each earlier step can put into the answers, so conditional copy can be
 * resolved rather than shown as "(depends on answers)".
 *
 * Free-text steps are deliberately absent: their values can't be enumerated,
 * and guessing one would make the diagram assert a branch that may not exist.
 */
function answerSources(steps: Step[]): { id: string; values: string[] }[] {
  const out: { id: string; values: string[] }[] = [];
  for (const step of steps) {
    if (step.kind === "choice") {
      out.push({
        id: step.id,
        values: step.options.concat(step.other ? ["Something else"] : []),
      });
    } else if (step.kind === "pickGrants") {
      out.push({ id: step.id, values: ["one or more storms", NO_STORMS] });
    }
  }
  return out;
}

/**
 * Resolve a conditional step by varying one answer at a time from a baseline.
 *
 * One at a time rather than every combination: flows here branch on a single
 * answer, and the full cartesian product would grow past the point where the
 * diagram is readable while adding nothing.
 */
function variantsOf(step: Step, steps: Step[]): Variant[] {
  const isFn =
    step.kind === "say" &&
    (typeof step.text === "function" || Boolean(step.pauseFrom));
  if (!isFn) return [];

  const sources = answerSources(steps);
  const baseline: Record<string, string> = {};
  for (const s of sources) baseline[s.id] = s.values[0];

  const resolve = (a: Record<string, string>): Variant => ({
    when: "",
    text:
      step.kind === "say" && typeof step.text === "function"
        ? step.text(a)
        : undefined,
    pause:
      step.kind === "say" && step.pauseFrom ? step.pauseFrom(a) : step.pause,
  });

  /* Only report answers the step actually reacts to. Varying `tenure` under a
     step that branches on `storms` yields the baseline output, and labelling
     that "when tenure = I own" would name the wrong cause. */
  const base = resolve(baseline);
  const baseKey = `${base.text}|${base.pause}`;

  const seen = new Map<string, Variant>();
  for (const src of sources) {
    const outputs = src.values.map((value) => ({
      value,
      v: resolve({ ...baseline, [src.id]: value }),
    }));
    const changes = outputs.some(
      ({ v }) => `${v.text}|${v.pause}` !== baseKey,
    );
    if (!changes) continue;

    for (const { value, v } of outputs) {
      const key = `${v.text}|${v.pause}`;
      if (!seen.has(key)) seen.set(key, { ...v, when: `${src.id} = ${value}` });
    }
  }
  return [...seen.values()];
}

function summarise(step: Step): string {
  const s = step as Step & Record<string, unknown>;
  switch (step.kind) {
    case "say":
      /* Lines that vary on earlier answers can't be shown as one string, so
         the map names the dependency rather than picking a branch. */
      return typeof step.text === "function"
        ? "(depends on answers)"
        : step.text;
    case "choice":
      return `asks "${step.id}"`;
    case "text":
      return `free text "${step.id}" — ${step.placeholder}`;
    case "goto":
      return `${step.label ?? "Hand off"} → ${
        typeof step.to === "function" ? "(depends on answers)" : step.to
      }`;
    case "map":
      return "locates the property";
    case "confirmAddress":
      return "confirm the match, add a unit number";
    case "askAddress":
      return "re-enter the address";
    case "grants":
      return "shows open programs by disaster";
    case "property":
      return "editable property details";
    case "risks":
      return "editable hazard list";
    case "insurance":
      return s.vehicle
        ? "connect a vehicle policy, upload, or none"
        : "connect, upload, or none";
    case "morePolicies":
      return "another policy, a vehicle policy, or done";
    case "uploadDoc":
      return "pick a category and type, photograph pages, see what was read";
    case "moreDocs":
      return "another document, or done";
    case "account":
      return "create an account";
    default:
      return "";
  }
}

export function analyseFlow(id: string, script: Script): FlowReport {
  const steps = script.steps;
  const problems: string[] = [];

  /* Reachability from step 0, following every branch rather than assuming the
     list runs top to bottom — the address loop jumps both ways. */
  const seen = new Set<number>();
  const queue = [0];
  while (queue.length) {
    const i = queue.shift();
    if (i == null || i < 0 || seen.has(i)) continue;
    seen.add(i);
    for (const e of edgesOf(steps, i)) if (e.to != null) queue.push(e.to);
  }

  const nodes: Node[] = steps.map((step, index) => {
    const edges = edgesOf(steps, index);

    for (const e of edges) {
      if (e.broken) {
        problems.push(
          `Step ${index + 1} (${step.kind}) jumps to a label that doesn't exist`,
        );
      } else if (!e.exit && e.to == null) {
        problems.push(
          `Step ${index + 1} (${step.kind})${
            e.on ? ` on "${e.on}"` : ""
          } has nowhere to go — the flow stops without handing off`,
        );
      }
    }
    if (edges.length === 0) {
      problems.push(`Step ${index + 1} (${step.kind}) offers no options`);
    }

    return {
      index,
      step,
      label: step.label,
      pause: step.pause,
      summary: summarise(step),
      edges,
      reachable: seen.has(index),
      variants: variantsOf(step, steps),
    };
  });

  for (const n of nodes) {
    if (!n.reachable) {
      problems.push(`Step ${n.index + 1} (${n.step.kind}) is unreachable`);
    }
  }
  if (steps.at(-1)?.kind !== "goto") {
    problems.push("Flow does not end on a hand-off into the app");
  }

  return {
    id,
    source: script.source,
    ads: Object.entries(AD_TO_SCRIPT)
      .filter(([, v]) => v === id)
      .map(([k]) => k),
    nodes,
    problems,
    reachable: seen.size,
    total: steps.length,
  };
}

export function analyseAll(): FlowReport[] {
  return Object.entries(SCRIPTS).map(([id, s]) => analyseFlow(id, s));
}
