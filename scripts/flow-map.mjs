#!/usr/bin/env node
/* ---------------------------------------------------------------------------
 * Chat flow maps.
 *
 * Reads src/onboarding/scripts.ts, transpiles it, and walks each flow to emit
 * a text diagram plus a set of checks.
 *
 * Generated rather than written by hand on purpose: a diagram maintained
 * separately from the scripts is wrong the first time someone edits a step,
 * and a stale flow map is worse than none because it gets trusted.
 *
 *   node scripts/flow-map.mjs          write docs/chat-flows.md
 *   node scripts/flow-map.mjs --check  exit non-zero if any check fails
 * ------------------------------------------------------------------------- */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const SRC = "src/onboarding/scripts.ts";
const OUT = "docs/chat-flows.md";

/* Transpile the script data to JS and import it, so the map is built from the
   same objects the app runs on rather than from a parse of the text. */
const js = ts.transpileModule(readFileSync(SRC, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const tmp = "node_modules/.cache/flow-scripts.mjs";
mkdirSync("node_modules/.cache", { recursive: true });
writeFileSync(tmp, js);
const { SCRIPTS, AD_TO_SCRIPT } = await import(pathToFileURL(tmp).href);

const labelIndex = (steps, label) => steps.findIndex((s) => s.label === label);

/** Where a step can go next. `null` target means the flow ends there. */
function edgesOf(steps, i) {
  const s = steps[i];
  const next = i + 1 < steps.length ? i + 1 : null;
  switch (s.kind) {
    case "goto":
      return [{ on: s.label ?? "hand off", to: null, exit: true }];
    case "confirmAddress":
      return [
        { on: "Yes, that's my home", to: labelIndex(steps, s.okTo) },
        { on: "That's not my address", to: labelIndex(steps, s.retryTo) },
      ];
    case "askAddress":
      return [{ on: "address entered", to: labelIndex(steps, s.backTo) }];
    case "choice":
      return s.options
        .concat(s.other ? ["Something else (free text)"] : [])
        .map((o) => ({ on: o, to: next }));
    case "pickGrants":
      return [
        { on: "one or more storms", to: next },
        { on: "neither damaged my home", to: next },
      ];
    case "resiliency":
      return [
        { on: "Yes interested", to: next },
        { on: "Maybe — save for now", to: next },
        { on: "Not right now", to: next },
      ];
    case "insurance":
      return [
        { on: "Connect my policy", to: next },
        { on: "Upload declarations", to: next },
        { on: "No insurance", to: next },
      ];
    default:
      return [{ on: null, to: next }];
  }
}

const INTERACTIVE = new Set([
  "confirmAddress",
  "askAddress",
  "choice",
  "pickGrants",
  "resiliency",
  "property",
  "risks",
  "insurance",
  "text",
  "account",
  "goto",
]);

function summarise(step) {
  switch (step.kind) {
    case "say":
      return `"${step.text}"`;
    case "choice":
      return `asks "${step.id}"`;
    case "text":
      return `free text "${step.id}" — ${step.placeholder}`;
    case "goto":
      return `${step.label ?? "hand off"} → ${
        typeof step.to === "function" ? "(depends on answers)" : step.to
      }`;
    default:
      return "";
  }
}

function analyse(id, script) {
  const steps = script.steps;
  const lines = [];
  const problems = [];

  /* Reachability from step 0, following every branch. */
  const seen = new Set();
  const queue = [0];
  while (queue.length) {
    const i = queue.shift();
    if (i == null || i < 0 || seen.has(i)) continue;
    seen.add(i);
    for (const e of edgesOf(steps, i)) if (e.to != null) queue.push(e.to);
  }

  steps.forEach((step, i) => {
    const n = String(i + 1).padStart(2, " ");
    const label = step.label ? ` [${step.label}]` : "";
    const pause = step.pause ? ` (${step.pause}ms)` : "";
    const reach = seen.has(i) ? " " : "!";
    const kind = step.kind.toUpperCase().padEnd(15);
    lines.push(`${reach}${n}  ${kind}${label}${pause} ${summarise(step)}`.trimEnd());

    const edges = edgesOf(steps, i);
    for (const e of edges) {
      if (e.exit) {
        lines.push(`             └─ ends the flow`);
        continue;
      }
      if (e.to == null) {
        problems.push(
          `step ${i + 1} (${step.kind})${e.on ? ` on "${e.on}"` : ""} has nowhere to go — the flow stops without handing off`,
        );
        lines.push(`             └─ DEAD END${e.on ? ` on "${e.on}"` : ""}`);
        continue;
      }
      if (e.to < 0) {
        problems.push(
          `step ${i + 1} (${step.kind}) jumps to a label that doesn't exist`,
        );
        lines.push(`             └─ BROKEN JUMP`);
        continue;
      }
      if (e.on) {
        const arrow = e.to <= i ? "loops back to" : "→";
        lines.push(`             ├─ "${e.on}" ${arrow} step ${e.to + 1}`);
      }
    }
  });

  steps.forEach((step, i) => {
    if (!seen.has(i)) {
      problems.push(`step ${i + 1} (${step.kind}) is unreachable`);
    }
    if (INTERACTIVE.has(step.kind) && step.kind !== "goto") {
      const edges = edgesOf(steps, i);
      if (edges.length === 0) {
        problems.push(`step ${i + 1} (${step.kind}) offers no options`);
      }
    }
  });

  if (steps.at(-1)?.kind !== "goto") {
    problems.push(`flow does not end on a hand-off into the app`);
  }

  const ads = Object.entries(AD_TO_SCRIPT)
    .filter(([, v]) => v === id)
    .map(([k]) => k);

  return { lines, problems, ads, reachable: seen.size, total: steps.length };
}

const out = [
  "# Chat flow maps",
  "",
  "Generated by `node scripts/flow-map.mjs` from `src/onboarding/scripts.ts`.",
  "Do not edit by hand — regenerate instead.",
  "",
  "`!` in the left column marks a step no path reaches.",
  "",
];

let failures = 0;

for (const [id, script] of Object.entries(SCRIPTS)) {
  const { lines, problems, ads, reachable, total } = analyse(id, script);
  out.push(`## ${id} — ${script.source}`);
  out.push("");
  out.push(
    `Reached from ad${ads.length === 1 ? "" : "s"} ${ads.join(", ") || "—"} · ${reachable} of ${total} steps reachable`,
  );
  out.push("");
  out.push("```");
  out.push(...lines);
  out.push("```");
  out.push("");
  if (problems.length) {
    failures += problems.length;
    out.push("**Problems**");
    out.push("");
    for (const p of problems) out.push(`- ${p}`);
  } else {
    out.push("No dead ends, broken jumps or unreachable steps.");
  }
  out.push("");
}

mkdirSync("docs", { recursive: true });
writeFileSync(OUT, out.join("\n"));

console.log(out.join("\n"));
console.log(
  failures ? `\n${failures} problem(s) found.` : "\nAll flows check out.",
);

if (process.argv.includes("--check") && failures) process.exit(1);
