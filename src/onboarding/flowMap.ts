import { AD_TO_SCRIPT, SCRIPTS, type Script, type Step } from "./scripts";

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
};

export interface Edge {
  /** What the person did. Null for steps that simply advance. */
  on: string | null;
  /** Destination index, or null if the flow ends or goes nowhere. */
  to: number | null;
  exit?: boolean;
  broken?: boolean;
}

export interface Node {
  index: number;
  step: Step;
  label?: string;
  pause?: number;
  summary: string;
  edges: Edge[];
  reachable: boolean;
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
    case "choice":
      return s.options
        .concat(s.other ? ["Something else (free text)"] : [])
        .map((o) => ({ on: o, to: next }));
    case "pickGrants":
    case "resiliency":
    case "insurance":
      return BRANCH_LABELS[s.kind].map((on) => ({ on, to: next }));
    default:
      return [{ on: null, to: next }];
  }
}

function summarise(step: Step): string {
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
      return "connect, upload, or none";
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
