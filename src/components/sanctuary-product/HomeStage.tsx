import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useReducedMotion } from "framer-motion";
import { Compass } from "lucide-react";
import type { SanctuaryId, SanctuaryProfile } from "../../types/sanctuary";
import { getSanctuary } from "../../data/sanctuaries-b";
import { useSanctuaryStory } from "../../app/sanctuaryStory";
import { ALL_CHANNELS, profileParams } from "../sanctuary-b/models/state";
import { applyLook, lookToTheme, type SanctuaryLook } from "../sanctuary-b/look";
import { SanctuaryScene } from "../sanctuary-b/SanctuaryScene";
import { SanctuarySelector } from "../sanctuary-b/SanctuarySelector";

/**
 * The Home hero: the user's sanctuary standing in open atmosphere,
 * drag-to-rotate, its condition driven by what is true — never by a
 * leftover sandbox tweak. Look (color, brightness, model) is creative.
 */
export function HomeStage({
  profile,
  look,
  onLookChange,
  highlightAnchor,
  doneCount,
  onOpenExplore,
}: {
  profile: SanctuaryProfile;
  look: SanctuaryLook;
  onLookChange: (look: SanctuaryLook) => void;
  /** Scene region the active narrative chapter spotlights. */
  highlightAnchor: string | null;
  doneCount: number;
  onOpenExplore: () => void;
}) {
  const { sanctuaryId, setSanctuaryId } = useSanctuaryStory();
  const reducedMotion = useReducedMotion() ?? false;
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [previewId, setPreviewId] = useState<SanctuaryId | null>(null);

  const activeId = previewId ?? sanctuaryId;
  const sanctuary = getSanctuary(activeId);
  const theme = lookToTheme(look);

  const params = useMemo(() => {
    const raw = profileParams(profile, ALL_CHANNELS);
    // Home keeps the environment restrained — a low waterline rather than
    // a lake swallowing the diorama. Full effect lives in Explore.
    return applyLook(
      { ...raw, threat: Math.min(raw.threat, 0.2) },
      look,
    );
  }, [profile, look]);

  return (
    <>
      <SanctuaryScene
        sanctuary={sanctuary}
        params={params}
        theme={theme}
        sceneKey={`${activeId}:home:${doneCount}`}
        highlightAnchor={highlightAnchor}
        reducedMotion={reducedMotion}
      />

      <div className="gd-stage-actions">
        <button
          type="button"
          className="gd-swap"
          onClick={() => setSelectorOpen(true)}
        >
          Change model
        </button>
        <button type="button" className="gd-swap" onClick={onOpenExplore}>
          <Compass size={13} strokeWidth={2.2} aria-hidden="true" />
          Explore
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
    </>
  );
}
