import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, useReducedMotion } from "framer-motion";
import type { SanctuaryId, SanctuaryProfile } from "../../types/sanctuary";
import { getSanctuary } from "../../data/sanctuaries-b";
import { sanctuaryProfile } from "../../data/sanctuary-profile";
import {
  ALL_CHANNELS,
  profileParams,
  stateParams,
  type ChannelToggles,
} from "./models/state";
import {
  dimensionIndicators,
  sanctuaryAnnotations,
  sanctuaryInsight,
} from "./profile";
import { useBackground } from "../../app/background";
import { getSanctuaryTheme, themedParams } from "./themes";
import { SanctuaryScene } from "./SanctuaryScene";
import { SanctuaryDetails } from "./SanctuaryDetails";
import { SanctuarySelector } from "./SanctuarySelector";
import { ProfileDemoControl } from "./ProfileDemoControl";
import { ThemePicker } from "./ThemePicker";
import { WhySheet } from "./WhySheet";
import "./SanctuaryHero.css";

const STORAGE_KEY = "aidfinder:sanctuary-b";

/** The pristine showroom state every archetype presents in the choose view. */
const PRISTINE = stateParams("healthy");

function loadSanctuary(): SanctuaryId {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (
    stored === "castle" ||
    stored === "crystal" ||
    stored === "mountain" ||
    stored === "island" ||
    stored === "sky"
  ) {
    return stored;
  }
  return "castle";
}

/**
 * SANCTUARY 4.B — independent fork of the 4.A experience (components,
 * styles, and data are all cloned; nothing here is shared with 4.A except
 * the types), so this variant can diverge freely.
 *
 * Two views, two jobs. The choose view is a showroom: every archetype
 * renders pristine, and picking one is purely an aesthetic decision. The
 * risk view is where the sanctuary becomes personal — the four profile
 * dimensions drive their own visual channels (risk → environment,
 * readiness → structure, coverage → boundary, recovery → pathways), with
 * the headline insight, synthesized status, and compact scores below the
 * model, and "Why it looks this way" connecting each visual to the number
 * behind it.
 */
export function SanctuaryHero() {
  const [committedId, setCommittedId] = useState<SanctuaryId>(loadSanctuary);
  const [previewId, setPreviewId] = useState<SanctuaryId | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [view, setView] = useState<"choose" | "risk">("choose");
  const [profile, setProfile] = useState<SanctuaryProfile>(sanctuaryProfile);
  const [channels, setChannels] = useState<ChannelToggles>(ALL_CHANNELS);
  const [demoOpen, setDemoOpen] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(
    null,
  );
  const reducedMotion = useReducedMotion() ?? false;
  const { sanctuaryTheme } = useBackground();
  const theme = getSanctuaryTheme(sanctuaryTheme);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, committedId);
  }, [committedId]);

  // While the selector is open, taps preview live in the scene behind it.
  const activeId = previewId ?? committedId;
  const sanctuary = getSanctuary(activeId);

  const personalized = view === "risk";
  // Entering the risk view dissolves the showroom model and reforms it with
  // the profile channels applied — the moment the sanctuary becomes theirs.
  // The theme re-accents the calm glow color so windows, lanterns, and the
  // dome pick up the environment's cast.
  const params = useMemo(
    () =>
      themedParams(
        personalized ? profileParams(profile, channels) : PRISTINE,
        theme,
      ),
    [personalized, profile, channels, theme],
  );
  const sceneKey = `${activeId}:${personalized ? "risk" : "base"}`;

  const insight = useMemo(() => sanctuaryInsight(profile), [profile]);
  const indicators = useMemo(() => dimensionIndicators(profile), [profile]);
  const annotations = useMemo(() => sanctuaryAnnotations(profile), [profile]);
  const highlightAnchor =
    whyOpen && activeAnnotationId
      ? (annotations.find((a) => a.id === activeAnnotationId)?.anchor ?? null)
      : null;

  const confirmSelection = () => {
    if (previewId) setCommittedId(previewId);
    setPreviewId(null);
    setSelectorOpen(false);
  };

  const dismissSelector = () => {
    setPreviewId(null);
    setSelectorOpen(false);
  };

  const closeWhy = () => {
    setWhyOpen(false);
    setActiveAnnotationId(null);
  };

  const backToChoose = () => {
    setView("choose");
    setDemoOpen(false);
    closeWhy();
  };

  return (
    <section
      className={[
        "sanctuary-b",
        theme.ink === "light" ? "sanctuary-b--ink-light" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <p className="sanctuary-b__eyebrow">
        {view === "risk" ? sanctuary.name : "Your Sanctuary"}
      </p>

      <div
        className={[
          "sanctuary-b__stage",
          view === "risk" ? "sanctuary-b__stage--risk" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <SanctuaryScene
          sanctuary={sanctuary}
          params={params}
          theme={theme}
          sceneKey={sceneKey}
          highlightAnchor={highlightAnchor}
          reducedMotion={reducedMotion}
        />
      </div>

      {view === "choose" ? (
        <div className="sanctuary-b__panel">
          <SanctuaryDetails sanctuary={sanctuary} />

          <ThemePicker />

          <div className="sanctuary-b__actions">
            <button
              type="button"
              className="sanctuary-b__cta"
              onClick={() => setView("risk")}
            >
              Protect this place
            </button>
            <button
              type="button"
              className="sanctuary-b__change"
              onClick={() => setSelectorOpen(true)}
            >
              Change sanctuary
            </button>
          </div>
        </div>
      ) : (
        <div className="sanctuary-b__panel sanctuary-b__panel--risk">
          <div className="sanctuary-b-readout">
            <h1 className="sanctuary-b-readout__headline">
              {insight.headline}
            </h1>
            {/* The status line doubles as the hidden demo-control trigger. */}
            <button
              type="button"
              className="sanctuary-b-readout__status"
              onClick={() => setDemoOpen((v) => !v)}
              title="Toggle profile demo"
            >
              {insight.status}
            </button>
            <div className="sanctuary-b-readout__scores">
              {indicators.map((ind) => (
                <div
                  key={ind.id}
                  className={`sanctuary-b-score-chip${
                    ind.unknown ? " is-unknown" : ""
                  }`}
                >
                  <span className="sanctuary-b-score-chip__label">
                    {ind.label}
                  </span>
                  <span className="sanctuary-b-score-chip__value">
                    {ind.value}
                  </span>
                  <span className="sanctuary-b-score-chip__level">
                    {ind.level}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {demoOpen && (
              <ProfileDemoControl
                value={profile}
                channels={channels}
                onChange={setProfile}
                onChannelsChange={setChannels}
              />
            )}
          </AnimatePresence>

          <div className="sanctuary-b__actions">
            <button
              type="button"
              className="sanctuary-b__cta"
              onClick={() => setWhyOpen(true)}
            >
              Why it looks this way
            </button>
            <button
              type="button"
              className="sanctuary-b__change"
              onClick={backToChoose}
            >
              Back to your sanctuary
            </button>
          </div>
        </div>
      )}

      <div className="sanctuary-b__grain" aria-hidden="true" />

      <SanctuarySelector
        open={selectorOpen}
        committedId={committedId}
        previewId={previewId}
        onPreview={setPreviewId}
        onConfirm={confirmSelection}
        onClose={dismissSelector}
      />

      <WhySheet
        open={whyOpen}
        annotations={annotations}
        activeId={activeAnnotationId}
        onSelect={setActiveAnnotationId}
        onClose={closeWhy}
      />
    </section>
  );
}
