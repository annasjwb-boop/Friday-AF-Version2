import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Loader2,
  Mic,
  Pause,
  Play,
  Plus,
  Scissors,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import {
  CONTINUOUS_SCRIPT,
  formatValue,
  type VaultRoom,
  type WalkthroughBatch,
} from "../../data/vault";
import "./VaultWalkthrough.css";

type Stage = "intro" | "live" | "processing" | "summary";

/* Each step spends one beat while the AI checks the price, one beat settled,
   then folds into the running count. */
const BEAT_MS = 1350;

/* Static bar heights for the reference-style waveform. */
const WAVE_BARS = [
  8, 14, 10, 18, 12, 22, 16, 24, 14, 20, 10, 18, 24, 12, 16, 8, 14, 10,
];

type RoomTag = { id: string; name: string };

type VaultWalkthroughProps = {
  /** The home's rooms, shown as tag chips in the camera. */
  rooms: VaultRoom[];
  /** Persist a finished session's items. */
  onSave: (batches: WalkthroughBatch[]) => void;
  onClose: () => void;
};

export function VaultWalkthrough({
  rooms,
  onSave,
  onClose,
}: VaultWalkthroughProps) {
  const [stage, setStage] = useState<Stage>("intro");
  const [beat, setBeat] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const [capturedCount, setCapturedCount] = useState(CONTINUOUS_SCRIPT.length);

  /* Room tagging: null = Auto (AI detects), otherwise items are filed to the
     selected tag. Rooms added mid-session live in sessionRooms. */
  const [activeTag, setActiveTag] = useState<RoomTag | null>(null);
  const [sessionRooms, setSessionRooms] = useState<RoomTag[]>([]);
  const [addingRoom, setAddingRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");

  /* The room each captured item was filed to, recorded the moment it
     settles — so switching tags mid-recording only affects later items. */
  const [assignments, setAssignments] = useState<RoomTag[]>([]);
  const activeTagRef = useRef(activeTag);
  activeTagRef.current = activeTag;

  /* Clips: items before savedThrough are already banked to the inventory.
     Saving as you go means a mistake only ever costs the current clip. */
  const [savedThrough, setSavedThrough] = useState(0);
  const [clipCount, setClipCount] = useState(0);
  const [clipItems, setClipItems] = useState(0);
  const [clipValue, setClipValue] = useState(0);
  const [clipToast, setClipToast] = useState<{ duration: number } | null>(
    null,
  );
  const lastClipAtRef = useRef(0);

  const script = CONTINUOUS_SCRIPT;
  const totalBeats = script.length * 2;

  /* Drive the simulated capture session. */
  useEffect(() => {
    if (stage !== "live" || paused) return;
    const beatTimer = setInterval(() => {
      setBeat((b) => (b >= totalBeats ? b : b + 1));
    }, BEAT_MS);
    const clock = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => {
      clearInterval(beatTimer);
      clearInterval(clock);
    };
  }, [stage, paused, totalBeats]);

  /* Session finished — breathe for a beat, then process the footage. */
  useEffect(() => {
    if (stage !== "live" || beat < totalBeats) return;
    const id = setTimeout(() => setStage("processing"), 1100);
    return () => clearTimeout(id);
  }, [stage, beat, totalBeats]);

  /* Post-session processing: this is where matching + pricing "happens". */
  const [procTick, setProcTick] = useState(0);
  useEffect(() => {
    if (stage !== "processing") return;
    setProcTick(0);
    const id = setInterval(() => setProcTick((t) => t + 1), 800);
    return () => clearInterval(id);
  }, [stage]);
  useEffect(() => {
    if (stage === "processing" && procTick > 3) setStage("summary");
  }, [stage, procTick]);

  const stepIndex = Math.min(Math.floor(beat / 2), script.length - 1);
  const current = script[stepIndex];
  const done = beat >= totalBeats;
  const counted = Math.min(Math.floor(beat / 2), script.length);

  /* File each item to its room as it settles into the count. */
  useEffect(() => {
    setAssignments((prev) => {
      if (prev.length >= counted) return prev;
      const next = [...prev];
      for (let i = prev.length; i < counted; i += 1) {
        next.push(
          activeTagRef.current ?? {
            id: script[i].roomId,
            name: script[i].roomName,
          },
        );
      }
      return next;
    });
  }, [counted, script]);

  const tagFor = (index: number): RoomTag =>
    assignments[index] ??
    activeTag ?? { id: script[index].roomId, name: script[index].roomName };

  /* Group a range of captured items by assigned room. */
  const groupRange = (start: number, end: number) =>
    script.slice(start, end).reduce<
      { roomId: string; roomName: string; indices: number[] }[]
    >((acc, _step, offset) => {
      const i = start + offset;
      const tag = tagFor(i);
      const group = acc.find((g) => g.roomId === tag.id);
      if (group) group.indices.push(i);
      else acc.push({ roomId: tag.id, roomName: tag.name, indices: [i] });
      return acc;
    }, []);

  const batchesFor = (start: number, end: number): WalkthroughBatch[] =>
    groupRange(start, end).map((g) => ({
      roomId: g.roomId,
      roomName: g.roomName,
      items: g.indices.map((i) => ({
        id: `walk-${g.roomId}-${script[i].id}`,
        name: script[i].item.name,
        value: script[i].item.value,
        photo: true,
        receipt: false,
      })),
    }));

  /* What's recorded but not yet clipped. No item-level feedback is shown
     live — the user only sees clip durations; items appear post-processing. */
  const clipCounted = counted - savedThrough;
  const clipCountedValue = script
    .slice(savedThrough, counted)
    .reduce((s, step) => s + step.item.value, 0);

  const saveClip = () => {
    if (counted <= savedThrough) return;
    onSave(batchesFor(savedThrough, counted));
    setClipCount((c) => c + 1);
    setClipItems((n) => n + clipCounted);
    setClipValue((v) => v + clipCountedValue);
    setClipToast({ duration: seconds - lastClipAtRef.current });
    lastClipAtRef.current = seconds;
    setSavedThrough(counted);
    setTimeout(() => setClipToast(null), 1900);
  };

  /* The summary only deals with what hasn't been clipped yet. */
  const unsavedStart = Math.min(savedThrough, capturedCount);
  const unsavedSteps = script.slice(unsavedStart, capturedCount);
  const total = unsavedSteps.reduce((s, step) => s + step.item.value, 0);
  const groups = groupRange(unsavedStart, capturedCount);

  const saveAndClose = () => {
    if (capturedCount > unsavedStart) {
      onSave(batchesFor(unsavedStart, capturedCount));
    }
    onClose();
  };

  const addRoom = () => {
    const name = newRoomName.trim();
    if (!name) return;
    const tag = {
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name,
    };
    setSessionRooms((r) =>
      r.some((room) => room.id === tag.id) ? r : [...r, tag],
    );
    setActiveTag(tag);
    setNewRoomName("");
    setAddingRoom(false);
  };

  const tagOptions: RoomTag[] = [
    ...rooms.map((r) => ({ id: r.id, name: r.name })),
    ...sessionRooms,
  ];

  const host = document.getElementById("app-viewport");

  const overlay = (
    <motion.div
      className="vault-walkthrough"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {stage === "intro" && (
        <div className="vwt-intro">
          <button
            type="button"
            className="vwt-close"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={17} strokeWidth={2.2} />
          </button>
          <div className="vwt-intro__body">
            <span className="vwt-intro__mic" aria-hidden="true">
              <Mic size={22} strokeWidth={2} />
            </span>
            <span className="vwt-beta">Beta</span>
            <h1 className="vwt-intro__title">Walk &amp; talk your home</h1>
            <p className="vwt-intro__lede">
              Record as you walk and just say what you see — the camera notes
              each item, then AI verifies and prices everything from your
              video once you&rsquo;re done.
            </p>
            <ul className="vwt-intro__hints">
              <li>
                <span className="vwt-intro__hint-icon" aria-hidden="true">
                  <Tag size={14} strokeWidth={2} />
                </span>
                Tag the room you&rsquo;re in as you go — switch anytime
              </li>
              <li>
                <span className="vwt-intro__hint-icon" aria-hidden="true">
                  <Sparkles size={14} strokeWidth={2} />
                </span>
                Or leave it on Auto and AI sorts items into rooms
              </li>
              <li>
                <span className="vwt-intro__hint-icon" aria-hidden="true">
                  <Scissors size={14} strokeWidth={2} />
                </span>
                Clip to save as you go — a redo only costs one clip
              </li>
            </ul>
            <button
              type="button"
              className="vwt-intro__cta"
              onClick={() => setStage("live")}
            >
              Start recording
            </button>
            <p className="vwt-intro__note">
              Video stays on your device. Only the item list is saved.
            </p>
          </div>
        </div>
      )}

      {stage === "live" && (
        <div className="vwc">
          {/* --- Viewfinder: top two-thirds ------------------------------- */}
          <div className="vwc__finder">
            <div className="vwc__scene" aria-hidden="true" />
            {paused && <div className="vwc__paused-scrim" aria-hidden="true" />}

            <header className="vwc__top">
              <button
                type="button"
                className="vwc__cancel"
                aria-label="Cancel walkthrough"
                onClick={onClose}
              >
                <X size={16} strokeWidth={2.2} />
              </button>
              <span className={`vwc__rec${paused ? " is-paused" : ""}`}>
                <i aria-hidden="true" />
                {paused
                  ? "Paused"
                  : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`}
              </span>
            </header>

            {/* No item-level feedback while recording — just clip status. */}
            <div className="vwc__capture">
              <AnimatePresence mode="wait">
                {clipToast ? (
                  <motion.span
                    key="clip-toast"
                    className="vwc__clip-toast"
                    initial={{ opacity: 0, y: -6, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                  >
                    <Check size={12} strokeWidth={2.6} aria-hidden="true" />
                    Clip saved ·{" "}
                    {`${Math.floor(clipToast.duration / 60)}:${String(clipToast.duration % 60).padStart(2, "0")}`}
                  </motion.span>
                ) : (
                  clipCount > 0 && (
                    <motion.span
                      key="clip-count"
                      className="vwc__clips"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.25 }}
                    >
                      {clipCount} {clipCount === 1 ? "clip" : "clips"} saved ·
                      processed when you finish
                    </motion.span>
                  )
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* --- Bottom panel: tags, transcript, controls ------------------- */}
          <div className="vwc__panel">
            {addingRoom ? (
              <div className="vwc__add-room">
                <input
                  type="text"
                  className="vwc__add-input"
                  placeholder="Room name — attic, shed, hallway…"
                  value={newRoomName}
                  autoFocus
                  onChange={(e) => setNewRoomName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addRoom();
                    if (e.key === "Escape") setAddingRoom(false);
                  }}
                />
                <button
                  type="button"
                  className="vwc__add-confirm"
                  onClick={addRoom}
                  disabled={!newRoomName.trim()}
                >
                  Add
                </button>
                <button
                  type="button"
                  className="vwc__add-cancel"
                  aria-label="Cancel"
                  onClick={() => {
                    setAddingRoom(false);
                    setNewRoomName("");
                  }}
                >
                  <X size={14} strokeWidth={2.2} />
                </button>
              </div>
            ) : (
              <div
                className="vwc__tags"
                role="tablist"
                aria-label="Tag the room you're recording"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTag === null}
                  className={`vwc__tag${activeTag === null ? " is-active" : ""}`}
                  onClick={() => setActiveTag(null)}
                >
                  <Sparkles size={12} strokeWidth={2.2} aria-hidden="true" />
                  Auto
                </button>
                {tagOptions.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTag?.id === tag.id}
                    className={`vwc__tag${activeTag?.id === tag.id ? " is-active" : ""}`}
                    onClick={() => setActiveTag(tag)}
                  >
                    {tag.name}
                  </button>
                ))}
                <button
                  type="button"
                  className="vwc__tag vwc__tag--add"
                  onClick={() => setAddingRoom(true)}
                >
                  <Plus size={12} strokeWidth={2.4} aria-hidden="true" />
                  Room
                </button>
              </div>
            )}

            <div className="vwc__voice">
              <h2 className="vwc__listening">
                {paused ? "Paused" : "Listening…"}
              </h2>
              <AnimatePresence mode="wait">
                <motion.p
                  key={paused ? "paused" : stepIndex}
                  className="vwc__transcript"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: paused ? 0.4 : 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.3 }}
                >
                  {paused
                    ? "Tap play to keep going."
                    : `“${current.transcript}”`}
                </motion.p>
              </AnimatePresence>
            </div>

            <footer className="vwc__controls">
              <button
                type="button"
                className="vwc__pause"
                aria-label={paused ? "Resume" : "Pause"}
                onClick={() => setPaused((p) => !p)}
              >
                {paused ? (
                  <Play size={17} strokeWidth={2} />
                ) : (
                  <Pause size={17} strokeWidth={2} />
                )}
              </button>
              <span
                className={`vwt-wave${done || paused ? " is-idle" : ""}`}
                aria-hidden="true"
              >
                {WAVE_BARS.map((h, i) => (
                  <i
                    key={i}
                    style={{ height: h, animationDelay: `${i * 70}ms` }}
                  />
                ))}
              </span>
              <button
                type="button"
                className="vwc__clip"
                disabled={clipCounted === 0}
                onClick={saveClip}
              >
                <Scissors size={13} strokeWidth={2.1} aria-hidden="true" />
                Clip
              </button>
              <button
                type="button"
                className="vwc__finish"
                aria-label="Finish and review"
                onClick={() => {
                  setCapturedCount(
                    Math.max(counted, savedThrough > 0 ? savedThrough : 1),
                  );
                  setStage("processing");
                }}
              >
                <Check size={19} strokeWidth={2.4} />
              </button>
            </footer>
          </div>
        </div>
      )}

      {stage === "processing" && (
        <div className="vwt-proc">
          <span className="vwt-proc__icon" aria-hidden="true">
            <Loader2 size={22} strokeWidth={2} className="vwt-spin" />
          </span>
          <h1 className="vwt-proc__title">Processing your walkthrough</h1>
          <p className="vwt-proc__sub">
            Matching what you said to your video…
          </p>
          <ul className="vwt-proc__checks">
            {[
              "Video reviewed",
              `${capturedCount} ${capturedCount === 1 ? "item" : "items"} matched`,
              "Prices checked with image search",
            ].map((label, i) => (
              <motion.li
                key={label}
                initial={{ opacity: 0, y: 6 }}
                animate={{
                  opacity: procTick >= i ? 1 : 0.25,
                  y: procTick >= i ? 0 : 6,
                }}
                transition={{ duration: 0.3 }}
              >
                <span
                  className={`vwt-proc__tick${procTick > i ? " is-done" : ""}`}
                  aria-hidden="true"
                >
                  {procTick > i ? (
                    <Check size={12} strokeWidth={2.8} />
                  ) : (
                    <Loader2
                      size={12}
                      strokeWidth={2.4}
                      className="vwt-spin"
                    />
                  )}
                </span>
                {label}
              </motion.li>
            ))}
          </ul>
        </div>
      )}

      {stage === "summary" && (
        <div className="vwt-summary">
          <header className="vwt-summary__head">
            <span className="vwt-summary__check" aria-hidden="true">
              <Check size={18} strokeWidth={2.4} />
            </span>
            {unsavedSteps.length > 0 ? (
              <>
                <h1 className="vwt-summary__title">
                  {unsavedSteps.length}{" "}
                  {unsavedSteps.length === 1 ? "item" : "items"} identified
                </h1>
                <p className="vwt-summary__sub">
                  {formatValue(total)} across {groups.length}{" "}
                  {groups.length === 1 ? "room" : "rooms"}.
                  {clipCount > 0 &&
                    ` Your ${clipCount} ${clipCount === 1 ? "clip" : "clips"} (${clipItems} ${clipItems === 1 ? "item" : "items"}) ${clipCount === 1 ? "is" : "are"} already saved.`}
                </p>
              </>
            ) : (
              <>
                <h1 className="vwt-summary__title">All clips saved</h1>
                <p className="vwt-summary__sub">
                  {clipItems} {clipItems === 1 ? "item" : "items"} ·{" "}
                  {formatValue(clipValue)} added to your inventory across{" "}
                  {clipCount} {clipCount === 1 ? "clip" : "clips"}.
                </p>
              </>
            )}
          </header>
          <div className="vwt-summary__list">
            {groups.map((group) => (
              <section key={group.roomId} className="vwt-summary__group">
                {groups.length > 1 && (
                  <h2 className="vwt-summary__room">{group.roomName}</h2>
                )}
                <ul>
                  {group.indices.map((i) => (
                    <li key={script[i].id} className="vwt-summary__item">
                      <div className="vwt-summary__detail">
                        <span className="vwt-summary__name">
                          {script[i].item.name}
                        </span>
                        <span className="vwt-summary__flag">
                          {script[i].item.source === "video"
                            ? "Priced from your video"
                            : "Estimate — verify with receipt"}
                          {script[i].item.flag && ` · ${script[i].item.flag}`}
                        </span>
                      </div>
                      <span className="vwt-summary__value">
                        {script[i].item.source === "estimate" && "≈ "}
                        {formatValue(script[i].item.value)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <footer className="vwt-summary__foot">
            {unsavedSteps.length > 0 ? (
              <>
                <button
                  type="button"
                  className="vwt-summary__cta"
                  onClick={saveAndClose}
                >
                  Add to inventory
                </button>
                <button
                  type="button"
                  className="vwt-summary__discard"
                  onClick={onClose}
                >
                  {clipCount > 0 ? "Discard these — keep my clips" : "Discard"}
                </button>
              </>
            ) : (
              <button
                type="button"
                className="vwt-summary__cta"
                onClick={onClose}
              >
                Done
              </button>
            )}
          </footer>
        </div>
      )}
    </motion.div>
  );

  return host ? createPortal(overlay, host) : overlay;
}
