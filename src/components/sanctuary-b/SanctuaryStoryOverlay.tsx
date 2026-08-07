import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import type { SanctuaryId } from "../../types/sanctuary";
import { getSanctuary } from "../../data/sanctuaries-b";
import { sanctuaryProfile } from "../../data/sanctuary-profile";
import { useBackground } from "../../app/background";
import { useSanctuaryStory, type StoryOrigin } from "../../app/sanctuaryStory";
import { SanctuaryBBackground } from "../mobile/SanctuaryBBackground";
import { profileParams } from "./models/state";
import { getSanctuaryTheme, themedParams } from "./themes";
import { sanctuaryStory, type AnnotationAnchor } from "./profile";
import { SanctuaryScene } from "./SanctuaryScene";
import type { CameraFocus } from "./CameraController";
import { SanctuarySelector } from "./SanctuarySelector";
import { SanctuaryAppearanceSheet } from "./SanctuaryAppearanceSheet";
import "./SanctuaryStoryOverlay.css";

/** Fallback origin if the avatar rect could not be measured. */
const DEFAULT_ORIGIN: StoryOrigin = { x: 16, y: 14, size: 44 };

/** Composed viewpoints per story scene, relative to the model's hero yaw. */
const CAMERA_FOCI: Record<
  AnnotationAnchor,
  { dYaw: number; pitch: number; zoom: number }
> = {
  environment: { dYaw: 2.35, pitch: 0.21, zoom: 1.32 },
  structure: { dYaw: 0.55, pitch: 0, zoom: 0.86 },
  boundary: { dYaw: -1.15, pitch: 0.26, zoom: 1.1 },
  pathway: { dYaw: 3.1, pitch: 0.1, zoom: 1 },
};

/**
 * The immersive "Your Sanctuary" view. Mounts as an overlay above the
 * working app and performs the shared-element expansion itself: a rounded
 * container starts at the header avatar's exact rect and springs open to
 * the full viewport, while the full-size story screen inside scales up
 * from cover-cropped miniature to final framing — so the model genuinely
 * grows from the avatar into its environment, and shrinks back on close.
 */
export default function SanctuaryStoryOverlay() {
  const { storyOpen, origin } = useSanctuaryStory();
  const reducedMotion = useReducedMotion() ?? false;

  const [mounted, setMounted] = useState(false);
  const [frame, setFrame] = useState<{ w: number; h: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Expansion progress (0 = avatar rect, 1 = full viewport) and the
  // reduced-motion crossfade veil.
  const progress = useMotionValue(0);
  const veil = useMotionValue(reducedMotion ? 0 : 1);

  useEffect(() => {
    if (storyOpen) setMounted(true);
  }, [storyOpen]);

  useLayoutEffect(() => {
    if (!mounted) return;
    const el = rootRef.current;
    if (el) setFrame({ w: el.clientWidth, h: el.clientHeight });
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !frame) return;
    if (reducedMotion) {
      // Crossfade instead of the spatial expansion.
      progress.set(1);
      const controls = animate(veil, storyOpen ? 1 : 0, {
        duration: 0.28,
        ease: "easeOut",
        onComplete: () => {
          if (!storyOpen) setMounted(false);
        },
      });
      return () => controls.stop();
    }
    const controls = animate(progress, storyOpen ? 1 : 0, {
      type: "spring",
      stiffness: 56,
      damping: 15.5,
      mass: 1,
      restDelta: 0.001,
      onComplete: () => {
        if (!storyOpen) setMounted(false);
      },
    });
    return () => controls.stop();
  }, [storyOpen, mounted, frame, reducedMotion, progress, veil]);

  if (!mounted) return null;

  return (
    <div className="sb-story" ref={rootRef}>
      {frame && (
        <StoryShell
          frame={frame}
          origin={origin ?? DEFAULT_ORIGIN}
          progress={progress}
          veil={veil}
          reducedMotion={reducedMotion}
        />
      )}
    </div>
  );
}

function StoryShell({
  frame,
  origin,
  progress,
  veil,
  reducedMotion,
}: {
  frame: { w: number; h: number };
  origin: StoryOrigin;
  progress: MotionValue<number>;
  veil: MotionValue<number>;
  reducedMotion: boolean;
}) {
  const {
    storyOpen,
    closeStory,
    sanctuaryId,
    setSanctuaryId,
    setLedgerTab,
  } = useSanctuaryStory();
  const { sanctuaryTheme } = useBackground();
  const theme = getSanctuaryTheme(sanctuaryTheme);

  const [selectorOpen, setSelectorOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [previewId, setPreviewId] = useState<SanctuaryId | null>(null);
  /** null = narrative overview; 0..n-1 = guided explore scene. */
  const [sceneIndex, setSceneIndex] = useState<number | null>(null);

  const activeId = previewId ?? sanctuaryId;
  const sanctuary = getSanctuary(activeId);
  const story = useMemo(() => sanctuaryStory(sanctuaryProfile), []);
  const params = useMemo(
    () => themedParams(profileParams(sanctuaryProfile), theme),
    [theme],
  );

  const activeScene = sceneIndex === null ? null : story.scenes[sceneIndex];
  const cameraFocus: CameraFocus | null = activeScene
    ? {
        yaw: sanctuary.heroYaw + CAMERA_FOCI[activeScene.anchor].dYaw,
        pitch: CAMERA_FOCI[activeScene.anchor].pitch,
        zoom: CAMERA_FOCI[activeScene.anchor].zoom,
      }
    : null;

  const handleClose = () => {
    setSelectorOpen(false);
    setAppearanceOpen(false);
    setPreviewId(null);
    setSceneIndex(null);
    closeStory();
  };

  const handleFinalAction = () => {
    setLedgerTab(story.finalAction.tab);
    handleClose();
  };

  useEffect(() => {
    if (!storyOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyOpen]);

  // Container: avatar rect -> full viewport.
  const left = useTransform(progress, [0, 1], [origin.x, 0]);
  const top = useTransform(progress, [0, 1], [origin.y, 0]);
  const width = useTransform(progress, [0, 1], [origin.size, frame.w]);
  const height = useTransform(progress, [0, 1], [origin.size, frame.h]);
  const radius = useTransform(progress, [0, 1], [15, 0]);
  // Inner stage: full-viewport screen, cover-cropped and centered in the
  // container, so the model scales continuously without distortion.
  const scale = useTransform(progress, (t) => {
    const w = origin.size + (frame.w - origin.size) * t;
    const h = origin.size + (frame.h - origin.size) * t;
    return Math.max(w / frame.w, h / frame.h);
  });
  // Story copy and chrome arrive once the model reaches ~80% of full size.
  const copyOpacity = useTransform(progress, [0.78, 1], [0, 1]);
  const copyY = useTransform(progress, [0.78, 1], [16, 0]);
  const copyEvents = useTransform(progress, (t) =>
    t > 0.95 ? ("auto" as const) : ("none" as const),
  );

  // The narrative panel seats into the mesh's own bottom wash: deep themes
  // scrim with their deep tone (the mesh already ends there), light themes
  // with their paper base — never a third color that bands the gradient.
  const scrim = theme.ink === "light" ? theme.meshDeep : theme.base;

  return (
    <motion.div
      className="sb-story__container"
      style={{ left, top, width, height, borderRadius: radius, opacity: veil }}
    >
      <motion.div
        className="sb-story__stage-holder"
        style={{
          width: frame.w,
          height: frame.h,
          marginLeft: -frame.w / 2,
          marginTop: -frame.h / 2,
          scale,
        }}
      >
        <div
          className={[
            "sb-story__screen",
            theme.ink === "light" ? "sb-story--ink-light" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <SanctuaryBBackground />

          <div className="sb-story__stage">
            <SanctuaryScene
              sanctuary={sanctuary}
              params={params}
              theme={theme}
              sceneKey={`${activeId}:story`}
              highlightAnchor={activeScene?.anchor ?? null}
              cameraFocus={cameraFocus}
              reducedMotion={reducedMotion}
            />
          </div>

          <motion.div
            className="sb-story__chrome"
            style={{ opacity: copyOpacity, pointerEvents: copyEvents }}
          >
            <button
              type="button"
              className="sb-story__chrome-btn"
              aria-label="Close your sanctuary"
              onClick={handleClose}
            >
              <X size={19} strokeWidth={2} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="sb-story__chrome-btn"
              aria-label="Appearance settings"
              onClick={() => setAppearanceOpen(true)}
            >
              <SlidersHorizontal size={17} strokeWidth={2} aria-hidden="true" />
            </button>
          </motion.div>

          <motion.div
            className="sb-story__panel"
            style={{
              opacity: copyOpacity,
              y: copyY,
              pointerEvents: copyEvents,
              background: `linear-gradient(to top, ${scrim}f2 0%, ${scrim}c4 62%, ${scrim}00 100%)`,
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {activeScene === null ? (
                <motion.div
                  key="overview"
                  className="sb-story__copy"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.26, ease: "easeOut" }}
                >
                  <p className="sb-story__eyebrow">Your Sanctuary</p>
                  <h1 className="sb-story__headline">{story.headline}</h1>
                  <p className="sb-story__body">{story.body}</p>
                  <button
                    type="button"
                    className="sb-story__cta"
                    onClick={() => setSceneIndex(0)}
                  >
                    Explore your home
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key={activeScene.id}
                  className="sb-story__copy"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.26, ease: "easeOut" }}
                >
                  <div className="sb-story__progress" aria-hidden="true">
                    {story.scenes.map((scene, i) => (
                      <button
                        key={scene.id}
                        type="button"
                        tabIndex={-1}
                        className={`sb-story__dot${i === sceneIndex ? " is-active" : ""}`}
                        onClick={() => setSceneIndex(i)}
                      />
                    ))}
                    <span className="sb-story__step">
                      {(sceneIndex ?? 0) + 1} of {story.scenes.length}
                    </span>
                  </div>
                  <h1 className="sb-story__headline">{activeScene.headline}</h1>
                  <p className="sb-story__body">{activeScene.body}</p>

                  {sceneIndex !== null && sceneIndex < story.scenes.length - 1 ? (
                    <div className="sb-story__scene-actions">
                      <button
                        type="button"
                        className="sb-story__cta"
                        onClick={() => setSceneIndex(sceneIndex + 1)}
                      >
                        Next
                      </button>
                      <button
                        type="button"
                        className="sb-story__quiet"
                        onClick={() =>
                          setSceneIndex(
                            sceneIndex === 0 ? null : sceneIndex - 1,
                          )
                        }
                      >
                        Back
                      </button>
                    </div>
                  ) : (
                    <div className="sb-story__scene-actions">
                      <button
                        type="button"
                        className="sb-story__cta"
                        onClick={handleFinalAction}
                      >
                        {story.finalAction.label}
                      </button>
                      <button
                        type="button"
                        className="sb-story__quiet"
                        onClick={() => setSceneIndex(null)}
                      >
                        Back to the story
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="sb-story__grain" aria-hidden="true" />

          <SanctuaryAppearanceSheet
            open={appearanceOpen}
            onClose={() => setAppearanceOpen(false)}
            onChangeSanctuary={() => {
              setAppearanceOpen(false);
              setSelectorOpen(true);
            }}
          />

          <SanctuarySelector
            open={selectorOpen}
            committedId={sanctuaryId}
            previewId={previewId}
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
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
