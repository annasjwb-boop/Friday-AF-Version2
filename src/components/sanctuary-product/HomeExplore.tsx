import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useReducedMotion } from "framer-motion";
import { ArrowLeft, RotateCcw } from "lucide-react";
import type { SanctuaryId, SanctuaryProfile } from "../../types/sanctuary";
import { sanctuaryProfile } from "../../data/sanctuary-profile";
import { getSanctuary } from "../../data/sanctuaries-b";
import { useSanctuaryStory } from "../../app/sanctuaryStory";
import { sanctuaryStory } from "../sanctuary-b/profile";
import { ALL_CHANNELS, profileParams } from "../sanctuary-b/models/state";
import {
  applyLook,
  lookToTheme,
  type SanctuaryLook,
} from "../sanctuary-b/look";
import { SanctuaryScene } from "../sanctuary-b/SanctuaryScene";
import { SanctuarySelector } from "../sanctuary-b/SanctuarySelector";

/** The four explorable dimensions behind the home's condition. */
export interface HomeDims {
  risk: number;
  readiness: number;
  coverage: number;
  recovery: number;
}

type DimId = keyof HomeDims;

const DIMENSIONS: {
  id: DimId;
  label: string;
  short: string;
  unit: string;
  trueHint: string;
  low: string;
  high: string;
  anchor: string;
}[] = [
  {
    id: "risk",
    label: "Flood risk",
    short: "Risk",
    unit: "chance water reaches home",
    trueHint: "Your real exposure today",
    low: "Calm seas — little environmental threat around the sanctuary.",
    high: "Storm water and weather press in. The environment becomes the story.",
    anchor: "environment",
  },
  {
    id: "readiness",
    label: "Readiness",
    short: "Ready",
    unit: "essentials documented",
    trueHint: "Your real documentation today",
    low: "Scaffolding and incomplete towers — the record is still thin.",
    high: "Fortified structure — a complete household record, lit from within.",
    anchor: "structure",
  },
  {
    id: "coverage",
    label: "Coverage",
    short: "Cover",
    unit: "rebuild protected",
    trueHint: "Your real dwelling coverage today",
    low: "The protective boundary thins. A rebuild would leave a financial gap.",
    high: "A solid dome — recovery is financially protected.",
    anchor: "boundary",
  },
  {
    id: "recovery",
    label: "Recovery",
    short: "Recover",
    unit: "pathway funded",
    trueHint: "Your real recovery plan today",
    low: "Pathways home fade — fewer funded routes back after a disaster.",
    high: "Clear pathways and a lit beacon — recovery routes are ready.",
    anchor: "pathway",
  },
];

/**
 * Full-page home explore tool. A sandbox for watching how the underlying
 * numbers reshape the sanctuary. Number tweaks never leave this page;
 * closing always returns Home to what is true. Look (color, brightness,
 * model) is creative and lives in the model picker.
 */
export function HomeExplore({
  truth,
  look,
  onLookChange,
  doneCount,
  onClose,
}: {
  truth: HomeDims;
  look: SanctuaryLook;
  onLookChange: (look: SanctuaryLook) => void;
  doneCount: number;
  onClose: () => void;
}) {
  const { sanctuaryId, setSanctuaryId } = useSanctuaryStory();
  const reducedMotion = useReducedMotion() ?? false;
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [previewId, setPreviewId] = useState<SanctuaryId | null>(null);
  const [focus, setFocus] = useState<DimId>("risk");
  // Sandbox starts at truth; every drag is local and discarded on exit.
  const [sandbox, setSandbox] = useState<HomeDims>(truth);

  const activeId = previewId ?? sanctuaryId;
  const sanctuary = getSanctuary(activeId);
  const theme = lookToTheme(look);
  const dim = DIMENSIONS.find((d) => d.id === focus)!;
  const dirty = DIMENSIONS.some((d) => sandbox[d.id] !== truth[d.id]);

  const profile: SanctuaryProfile = useMemo(
    () => ({
      ...sanctuaryProfile,
      hazard: "flood",
      risk: sandbox.risk,
      readiness: sandbox.readiness,
      coverage: sandbox.coverage,
      coverageGapUsd: Math.round((100 - sandbox.coverage) * 6400),
      recovery: sandbox.recovery,
    }),
    [sandbox],
  );

  const story = useMemo(() => sanctuaryStory(profile), [profile]);

  const params = useMemo(
    () => applyLook(profileParams(profile, ALL_CHANNELS), look),
    [profile, look],
  );

  const impact =
    sandbox[focus] < 40 ? dim.low : sandbox[focus] > 70 ? dim.high : story.body;

  return (
    <div className="gd-explore">
      <div className="gd-explore__scroll">
        <header className="gd-explore__top">
          <button
            type="button"
            className="gd-explore__back"
            onClick={onClose}
            aria-label="Back to your home"
          >
            <ArrowLeft size={18} strokeWidth={2.2} aria-hidden="true" />
          </button>
          <div className="gd-explore__titles">
            <p className="gd-explore__kicker">Sandbox</p>
            <h1 className="gd-explore__title">Explore your home</h1>
          </div>
          <button
            type="button"
            className="gd-explore__reset"
            onClick={() => setSandbox(truth)}
            disabled={!dirty}
          >
            <RotateCcw size={13} strokeWidth={2.2} aria-hidden="true" />
            Truth
          </button>
        </header>

        <p className="gd-explore__promise">
          Drag the numbers. Watch the sanctuary change. Leaving always returns
          to what&rsquo;s true.
        </p>

        <div className="gd-explore__stage">
          <SanctuaryScene
            sanctuary={sanctuary}
            params={params}
            theme={theme}
            sceneKey={`${activeId}:explore:${doneCount}:${sandbox.readiness}`}
            highlightAnchor={dim.anchor}
            reducedMotion={reducedMotion}
          />
        </div>

        <div
          className="gd-explore__reading"
          key={`${focus}-${Math.round(sandbox[focus] / 5)}`}
        >
          <p className="gd-explore__reading-kicker">{dim.label}</p>
          <h2 className="gd-explore__reading-headline">{story.headline}</h2>
          <p className="gd-explore__reading-body">{impact}</p>
        </div>

        {/* Dimension focus — pick one lever, explore it deeply. */}
        <div
          className="gd-explore__dims"
          role="tablist"
          aria-label="What to explore"
        >
          {DIMENSIONS.map((d) => (
            <button
              key={d.id}
              type="button"
              role="tab"
              aria-selected={d.id === focus}
              className={`gd-explore__dim${d.id === focus ? " is-active" : ""}${sandbox[d.id] !== truth[d.id] ? " is-dirty" : ""}`}
              onClick={() => setFocus(d.id)}
            >
              <span className="gd-explore__dim-label">{d.short}</span>
              <strong className="gd-explore__dim-value">{sandbox[d.id]}</strong>
            </button>
          ))}
        </div>

        <div className="gd-explore__lever">
          <div className="gd-explore__lever-head">
            <div>
              <p className="gd-explore__lever-label">{dim.label}</p>
              <p className="gd-explore__lever-unit">{dim.unit}</p>
            </div>
            <div className="gd-explore__lever-nums">
              <strong>{sandbox[focus]}</strong>
              <span>
                true {truth[focus]}
                {sandbox[focus] !== truth[focus] ? " · exploring" : ""}
              </span>
            </div>
          </div>

          <div className="gd-explore__track">
            {/* Marker for the true value — the sandbox always points home. */}
            <span
              className="gd-explore__truth-mark"
              style={{ left: `${truth[focus]}%` }}
              aria-hidden="true"
              title={dim.trueHint}
            />
            <input
              type="range"
              min={0}
              max={100}
              value={sandbox[focus]}
              aria-label={dim.label}
              onChange={(event) =>
                setSandbox((s) => ({
                  ...s,
                  [focus]: Number(event.target.value),
                }))
              }
            />
          </div>
          <div className="gd-explore__track-ends" aria-hidden="true">
            <span>0</span>
            <span>100</span>
          </div>
        </div>

        <button
          type="button"
          className="gd-explore__model"
          onClick={() => setSelectorOpen(true)}
        >
          Model & look
          <span>{sanctuary.name}</span>
        </button>
      </div>

      <div className="gd-explore__foot">
        <button
          type="button"
          className="gd-pill gd-explore__done"
          onClick={onClose}
        >
          Back to your home
        </button>
      </div>

      {createPortal(
        <SanctuarySelector
          open={selectorOpen}
          committedId={sanctuaryId}
          previewId={previewId}
          appearance="product"
          look={look}
          onLookChange={onLookChange}
          onPreview={setPreviewId}
          onConfirm={() => {
            if (previewId) setSanctuaryId(previewId);
            setPreviewId(null);
            setSelectorOpen(false);
          }}
          onClose={() => {
            setPreviewId(null);
            setSelectorOpen(false);
          }}
        />,
        document.getElementById("app-viewport") ?? document.body,
      )}
    </div>
  );
}
