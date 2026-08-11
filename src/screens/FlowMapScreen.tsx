import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Play } from "lucide-react";
import { SCRIPTS } from "../onboarding/scripts";
import { analyseFlow, type Edge, type Node } from "../onboarding/flowMap";
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

function StepRow({ node }: { node: Node }) {
  return (
    <li className={`fm-step${node.reachable ? "" : " is-orphan"}`}>
      <span className="fm-step__n">{node.index + 1}</span>
      <div className="fm-step__body">
        <p className="fm-step__head">
          <span className="fm-step__kind">{node.step.kind}</span>
          {node.label && <span className="fm-step__label">{node.label}</span>}
          {node.pause && <span className="fm-step__pause">{node.pause}ms</span>}
          {!node.reachable && (
            <span className="fm-step__orphan">unreachable</span>
          )}
        </p>
        <p className="fm-step__text">{node.summary}</p>
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
  const report = analyseFlow(id, SCRIPTS[id]);

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
          <Link to={`/start/${report.id}`} className="fm__run">
            <Play size={14} strokeWidth={2} aria-hidden="true" />
            Run the flow
          </Link>
        </header>

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
            <StepRow key={n.index} node={n} />
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
