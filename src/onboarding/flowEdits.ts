import { SCRIPTS, type Script, type Step } from "./scripts";

/* ---------------------------------------------------------------------------
 * Editing the flows in the browser.
 *
 * There's no backend, so edits live in localStorage as a patch over the
 * committed scripts rather than replacing them. Two reasons that matters:
 * clearing the edits always returns you to what's in the repo, and the export
 * below can show exactly what changed rather than dumping the whole file.
 *
 * The honest limitation, stated on the screen as well as here: nothing in a
 * browser can write to the repo. Edits are real for anyone using that browser
 * — the flows genuinely run them — but they reach the codebase only by being
 * copied out and committed. The Export button produces the file to paste.
 * ------------------------------------------------------------------------- */

const KEY = "aidfinder:flow-edits";

/** Only the fields worth editing from a diagram. */
export interface StepPatch {
  text?: string;
  pause?: number;
  options?: string[];
  placeholder?: string;
  label?: string;
}

export type FlowEdits = Record<string, Record<number, StepPatch>>;

export function loadEdits(): FlowEdits {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as FlowEdits;
  } catch {
    return {};
  }
}

export function saveEdits(edits: FlowEdits) {
  localStorage.setItem(KEY, JSON.stringify(edits));
  /* Flows already mounted need to pick this up without a reload. */
  window.dispatchEvent(new Event("flow-edits"));
}

export function setStepPatch(
  flowId: string,
  index: number,
  patch: StepPatch | null,
) {
  const edits = loadEdits();
  const flow = { ...edits[flowId] };

  if (patch === null) delete flow[index];
  else flow[index] = { ...flow[index], ...patch };

  if (Object.keys(flow).length === 0) delete edits[flowId];
  else edits[flowId] = flow;

  saveEdits(edits);
}

export function clearEdits(flowId?: string) {
  if (!flowId) {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event("flow-edits"));
    return;
  }
  const edits = loadEdits();
  delete edits[flowId];
  saveEdits(edits);
}

export function countEdits(edits: FlowEdits = loadEdits()): number {
  return Object.values(edits).reduce((n, f) => n + Object.keys(f).length, 0);
}

/** The committed script with any local edits applied. */
export function editedScript(id: string, edits: FlowEdits = loadEdits()): Script {
  const base = SCRIPTS[id];
  const patches = edits[id];
  if (!base || !patches) return base;

  return {
    ...base,
    steps: base.steps.map((step, i) => {
      const p = patches[i];
      if (!p) return step;
      const next = { ...step } as Step & Record<string, unknown>;
      if (p.text !== undefined) next.text = p.text;
      if (p.placeholder !== undefined) next.placeholder = p.placeholder;
      if (p.options !== undefined) next.options = p.options;
      if (p.label !== undefined) next.label = p.label;
      if (p.pause !== undefined) {
        if (p.pause > 0) next.pause = p.pause;
        else delete next.pause;
      }
      return next as Step;
    }),
  };
}

export function editedScripts(edits: FlowEdits = loadEdits()) {
  const out: Record<string, Script> = {};
  for (const id of Object.keys(SCRIPTS)) out[id] = editedScript(id, edits);
  return out;
}

/* --- Export ---------------------------------------------------------------- */

const q = (s: string) => JSON.stringify(s);

/**
 * A summary of what changed, for pasting into a commit or a message.
 *
 * Deliberately a diff rather than a regenerated scripts.ts: the real file
 * carries comments explaining why several lines are worded the way they are,
 * and a machine-written replacement would silently drop them.
 */
export function exportEdits(edits: FlowEdits = loadEdits()): string {
  const lines: string[] = [
    "Flow edits made in the browser at /flows.",
    "Apply these to src/onboarding/scripts.ts and commit — nothing here",
    "reaches the repo on its own.",
    "",
  ];

  for (const [flowId, patches] of Object.entries(edits)) {
    const base = SCRIPTS[flowId];
    if (!base) continue;
    lines.push(`## ${flowId} — ${base.source}`, "");

    for (const [idxStr, patch] of Object.entries(patches)) {
      const i = Number(idxStr);
      const step = base.steps[i] as Step & Record<string, unknown>;
      lines.push(`Step ${i + 1} (${step.kind})`);

      for (const [field, value] of Object.entries(patch)) {
        const before = step[field];
        const fmt = (v: unknown) =>
          Array.isArray(v) ? `[${v.map(q).join(", ")}]` : q(String(v ?? ""));
        lines.push(`  ${field}:`);
        lines.push(`    was ${fmt(before)}`);
        lines.push(`    now ${fmt(value)}`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}
