import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, Pencil, Play, RotateCcw, X } from "lucide-react";
import { SCRIPTS } from "../onboarding/scripts";
import { analyseFlow, type Edge, type Node } from "../onboarding/flowMap";
import {
  clearEdits,
  countEdits,
  editedScript,
  exportEdits,
  loadEdits,
  setStepPatch,
} from "../onboarding/flowEdits";
import "./FlowMapScreen.css";

/* ---------------------------------------------------------------------------
 * The chat flow, drawn from the script itself.
 *
 * A debugging surface: every step, every option branching off it, and where
 * each one lands — so a branch that goes nowhere is visible rather than only
 * findable by clicking through the flow and guessing what you missed.
 *
 * Shares its traversal with scripts/flow-map.mjs, so this screen and the
 * committed document can't tell different stories.
 * ------------------------------------------------------------------------- */

function EdgeLine({ edge, from }: { edge: Edge; from: number }) {
  if (edge.exit) {
    return <li className="fm-edge fm-edge--exit">ends the flow</li>;
  }
  if (edge.broken) {
    return (
      <li className="fm-edge fm-edge--bad">
        <b>{edge.on}</b> jumps to a label that doesn't exist
      </li>
    );
  }
  if (edge.to == null) {
    return (
      <li className="fm-edge fm-edge--bad">
        {edge.on ? <b>{edge.on}</b> : null} dead end
      </li>
    );
  }
  const back = edge.to <= from;
  return (
    <li className={`fm-edge${back ? " fm-edge--loop" : ""}`}>
      {edge.on ? <b>{edge.on}</b> : <i>continues</i>}
      <span>
        {back ? "loops back to" : "goes to"} step {edge.to + 1}
      </span>
    </li>
  );
}

/** Which fields of a step can be changed from here. */
function editableFields(step: Node["step"]) {
  const kind = step.kind;
  return {
    text: kind === "say",
    placeholder: kind === "text",
    options: kind === "choice",
    /* Any step can hold before it appears, not just spoken lines. */
    pause: true,
  };
}

function StepRow({
  node,
  flowId,
  edited,
  onChange,
}: {
  node: Node;
  flowId: string;
  edited: boolean;
  onChange: () => void;
}) {
  const [open, setOpen] = useState(false);
  const fields = editableFields(node.step);
  const step = node.step as Node["step"] & Record<string, unknown>;

  const [text, setText] = useState(String(step.text ?? ""));
  const [placeholder, setPlaceholder] = useState(
    String(step.placeholder ?? ""),
  );
  const [options, setOptions] = useState((step.options as string[]) ?? []);
  const [pause, setPause] = useState(node.pause ?? 0);

  const save = () => {
    const patch: Record<string, unknown> = { pause };
    if (fields.text) patch.text = text;
    if (fields.placeholder) patch.placeholder = placeholder;
    if (fields.options) patch.options = options.filter((o) => o.trim());
    setStepPatch(flowId, node.index, patch);
    setOpen(false);
    onChange();
  };

  const revert = () => {
    setStepPatch(flowId, node.index, null);
    setOpen(false);
    onChange();
  };

  return (
    <li
      className={`fm-step${node.reachable ? "" : " is-orphan"}${
        edited ? " is-edited" : ""
      }`}
    >
      <span className="fm-step__n">{node.index + 1}</span>
      <div className="fm-step__body">
        <p className="fm-step__head">
          <span className="fm-step__kind">{node.step.kind}</span>
          {node.label && <span className="fm-step__label">{node.label}</span>}
          {node.pause && <span className="fm-step__pause">{node.pause}ms</span>}
          {edited && <span className="fm-step__edited">edited</span>}
          {!node.reachable && (
            <span className="fm-step__orphan">unreachable</span>
          )}
          <button
            type="button"
            className="fm-step__edit"
            aria-label={open ? "Close editor" : "Edit this step"}
            onClick={() => setOpen(!open)}
          >
            {open ? (
              <X size={13} strokeWidth={2.2} />
            ) : (
              <Pencil size={13} strokeWidth={2.2} />
            )}
          </button>
        </p>

        {open ? (
          <div className="fm-edit">
            {fields.text && (
              <label>
                <span>What the assistant says</span>
                <textarea
                  value={text}
                  rows={4}
                  onChange={(e) => setText(e.target.value)}
                />
              </label>
            )}
            {fields.placeholder && (
              <label>
                <span>Placeholder</span>
                <input
                  value={placeholder}
                  onChange={(e) => setPlaceholder(e.target.value)}
                />
              </label>
            )}
            {fields.options && (
              <div className="fm-edit__opts">
                <span>Options</span>
                {options.map((o, i) => (
                  <div key={i}>
                    <input
                      value={o}
                      onChange={(e) =>
                        setOptions((all) =>
                          all.map((x, n) => (n === i ? e.target.value : x)),
                        )
                      }
                    />
                    <button
                      type="button"
                      aria-label="Remove option"
                      onClick={() =>
                        setOptions((all) => all.filter((_, n) => n !== i))
                      }
                    >
                      <X size={13} strokeWidth={2.2} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="fm-edit__add"
                  onClick={() => setOptions((all) => [...all, ""])}
                >
                  Add an option
                </button>
              </div>
            )}
            <label className="fm-edit__pause">
              <span>Pause before this step</span>
              <input
                type="number"
                min={0}
                step={100}
                value={pause}
                onChange={(e) => setPause(Number(e.target.value))}
              />
              <em>ms · 0 for the default</em>
            </label>

            <div className="fm-edit__acts">
              <button type="button" className="fm-edit__save" onClick={save}>
                <Check size={14} strokeWidth={2.2} aria-hidden="true" />
                Save
              </button>
              {edited && (
                <button type="button" onClick={revert}>
                  Revert to committed
                </button>
              )}
            </div>
          </div>
        ) : (
          <p className="fm-step__text">{node.summary}</p>
        )}
        {node.edges.some((e) => e.on || e.exit || e.to == null) && (
          <ul className="fm-edges">
            {node.edges.map((e, i) => (
              <EdgeLine key={i} edge={e} from={node.index} />
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

export function FlowMapScreen() {
  const { flow } = useParams<{ flow: string }>();
  const id = flow && SCRIPTS[flow] ? flow : "aid";

  const [edits, setEdits] = useState(loadEdits);
  const refresh = useCallback(() => setEdits(loadEdits()), []);
  useEffect(() => {
    window.addEventListener("flow-edits", refresh);
    return () => window.removeEventListener("flow-edits", refresh);
  }, [refresh]);

  const [copied, setCopied] = useState(false);

  /* The diagram is built from the edited script, so the checks below run
     against what the flow will actually do — an edit that empties a choice's
     options shows up here as a problem immediately. */
  const report = analyseFlow(id, editedScript(id, edits));
  const flowEdits = edits[id] ?? {};
  const editCount = countEdits(edits);

  const copyExport = async () => {
    try {
      await navigator.clipboard.writeText(exportEdits(edits));
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* Clipboard can be blocked; the textarea below is the fallback. */
    }
  };

  return (
    <div className="fm">
      <div className="fm__wrap">
        <Link to="/campaigns" className="fm__back">
          <ArrowLeft size={15} strokeWidth={2} aria-hidden="true" />
          Campaigns
        </Link>

        <header className="fm__head">
          <h1 className="fm__title">{report.source}</h1>
          <p className="fm__meta">
            Flow <code>{report.id}</code> · reached from ad
            {report.ads.length === 1 ? "" : "s"} {report.ads.join(", ") || "—"} ·{" "}
            {report.reachable} of {report.total} steps reachable
          </p>
          <div className="fm__acts">
            <Link to={`/start/${report.id}`} className="fm__run">
              <Play size={14} strokeWidth={2} aria-hidden="true" />
              Run the flow
            </Link>
            {Object.keys(flowEdits).length > 0 && (
              <button
                type="button"
                className="fm__reset"
                onClick={() => {
                  clearEdits(id);
                  refresh();
                }}
              >
                <RotateCcw size={13} strokeWidth={2} aria-hidden="true" />
                Reset this flow
              </button>
            )}
          </div>
        </header>

        {editCount > 0 && (
          <div className="fm__edits">
            <p className="fm__edits-head">
              {editCount} unsaved edit{editCount === 1 ? "" : "s"} in this
              browser
            </p>
            <p>
              Edits apply straight away — run the flow and you'll see them. They
              live in this browser only, so they reach the codebase by being
              copied into <code>src/onboarding/scripts.ts</code> and committed.
            </p>
            <div className="fm__edits-acts">
              <button type="button" onClick={copyExport}>
                {copied ? "Copied" : "Copy changes"}
              </button>
              <button
                type="button"
                onClick={() => {
                  clearEdits();
                  refresh();
                }}
              >
                Discard all
              </button>
            </div>
            <textarea readOnly value={exportEdits(edits)} rows={8} />
          </div>
        )}

        {report.problems.length > 0 ? (
          <div className="fm__problems">
            <p className="fm__problems-head">
              {report.problems.length} problem
              {report.problems.length === 1 ? "" : "s"}
            </p>
            <ul>
              {report.problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="fm__clean">
            Every step is reachable, every option lands somewhere, and the flow
            ends by handing off into the app.
          </p>
        )}

        <ol className="fm-steps">
          {report.nodes.map((n) => (
            <StepRow
              key={n.index}
              node={n}
              flowId={id}
              edited={Boolean(flowEdits[n.index])}
              onChange={refresh}
            />
          ))}
        </ol>

        <nav className="fm__others">
          {Object.keys(SCRIPTS)
            .filter((k) => k !== id)
            .map((k) => (
              <Link key={k} to={`/flows/${k}`}>
                {SCRIPTS[k].source}
              </Link>
            ))}
        </nav>
      </div>
    </div>
  );
}
