import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { RiskState, SanctuaryId } from "../../types/sanctuary";
import { getSanctuary } from "../../data/sanctuaries";
import { riskScore } from "../../data/home";
import { RiskScoreHeroFlipped } from "../home/RiskScoreHeroFlipped";
import { SanctuaryScene } from "./SanctuaryScene";
import { SanctuaryDetails } from "./SanctuaryDetails";
import { SanctuarySelector } from "./SanctuarySelector";
import { RiskStateDemoControl } from "./RiskStateDemoControl";
import "./SanctuaryHero.css";

const STORAGE_KEY = "aidfinder:sanctuary";

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
 * The "Choose your sanctuary" hero experience: one large interactive 3D
 * place standing in for everything the user is protecting, with a selector
 * sheet, animated swaps, and a demo control for the risk-state system.
 */
export function SanctuaryHero() {
  const [committedId, setCommittedId] = useState<SanctuaryId>(loadSanctuary);
  const [previewId, setPreviewId] = useState<SanctuaryId | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [riskState, setRiskState] = useState<RiskState>("healthy");
  const [demoOpen, setDemoOpen] = useState(false);
  // "choose" is the sanctuary picker; "risk" overlays the score on the model.
  const [view, setView] = useState<"choose" | "risk">("choose");
  // In the risk view, tapping the model brings it forward (score steps back).
  const [modelForward, setModelForward] = useState(false);
  const reducedMotion = useReducedMotion() ?? false;

  const showScore = view === "risk" && !modelForward;

  const handleModelTap = useCallback(() => {
    setModelForward((v) => !v);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, committedId);
  }, [committedId]);

  // While the selector is open, taps preview live in the scene behind it.
  const activeId = previewId ?? committedId;
  const sanctuary = getSanctuary(activeId);

  const confirmSelection = () => {
    if (previewId) setCommittedId(previewId);
    setPreviewId(null);
    setSelectorOpen(false);
  };

  const dismissSelector = () => {
    setPreviewId(null);
    setSelectorOpen(false);
  };

  return (
    <section className="sanctuary">
      <p className="sanctuary__eyebrow">
        {view === "risk" ? "Your Risk Score" : "Your Sanctuary"}
      </p>

      <div
        className={[
          "sanctuary__stage",
          view === "risk" ? "sanctuary__stage--risk" : "",
          showScore ? "is-dimmed" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <SanctuaryScene
          sanctuary={sanctuary}
          riskState={riskState}
          reducedMotion={reducedMotion}
          onModelTap={view === "risk" ? handleModelTap : undefined}
        />
        <AnimatePresence>
          {showScore && (
            <motion.div
              className="sanctuary-score"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="sanctuary-score__inner">
                <RiskScoreHeroFlipped score={riskScore} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {view === "choose" ? (
        <div className="sanctuary__panel">
          <SanctuaryDetails
            sanctuary={sanctuary}
            riskState={riskState}
            onStatusTap={() => setDemoOpen((v) => !v)}
          />

          <AnimatePresence>
            {demoOpen && (
              <RiskStateDemoControl value={riskState} onChange={setRiskState} />
            )}
          </AnimatePresence>

          <div className="sanctuary__actions">
            <button
              type="button"
              className="sanctuary__cta"
              onClick={() => {
                setModelForward(false);
                setView("risk");
              }}
            >
              Protect this place
            </button>
            <button
              type="button"
              className="sanctuary__change"
              onClick={() => setSelectorOpen(true)}
            >
              Change sanctuary
            </button>
          </div>
        </div>
      ) : (
        <div className="sanctuary__panel sanctuary__panel--risk">
          <p className="sanctuary__hint">
            {modelForward
              ? "Tap your sanctuary to bring the score back."
              : "Drag to explore. Tap your sanctuary to bring it forward."}
          </p>
          <div className="sanctuary__actions">
            <button
              type="button"
              className="sanctuary__change"
              onClick={() => {
                setView("choose");
                setModelForward(false);
              }}
            >
              Back to your sanctuary
            </button>
          </div>
        </div>
      )}

      <div className="sanctuary__grain" aria-hidden="true" />

      <SanctuarySelector
        open={selectorOpen}
        committedId={committedId}
        previewId={previewId}
        onPreview={setPreviewId}
        onConfirm={confirmSelection}
        onClose={dismissSelector}
      />
    </section>
  );
}
