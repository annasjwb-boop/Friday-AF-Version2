import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ChevronLeft, CornerUpLeft } from "lucide-react";
import { type Step } from "./scripts";
import { editedScript, loadEdits } from "./flowEdits";
import {
  AccountStep,
  AskAddressStep,
  ChoiceStep,
  ConfirmAddressStep,
  DEFAULT_ADDRESS,
  GrantsStep,
  InsuranceStep,
  MoreDocsStep,
  MorePoliciesStep,
  MapStep,
  PickGrantsStep,
  PropertyStep,
  ResiliencyStep,
  RisksStep,
  TextStep,
  UploadDocStep,
  VideoScanStep,
} from "./steps";
import { useThreadScroll } from "../hooks/useThreadScroll";
import "./OnboardingFlow.css";

/* ---------------------------------------------------------------------------
 * Campaign onboarding.
 *
 * Plays a script from scripts.ts one step at a time: assistant lines advance
 * on a timer, interactive steps wait for the user. Answers echo back as user
 * bubbles so the transcript reads as a conversation rather than a form.
 *
 * The spec asks for a pause before each line so the typing feels human. That's
 * built, with two escapes — a skip control, and automatic disabling under
 * prefers-reduced-motion. Someone opening this after a storm shouldn't be made
 * to sit through eight seconds of simulated typing to reach a grant deadline.
 * ------------------------------------------------------------------------- */

/* Typing time is derived from the previous message rather than fixed, so a
 * one-word line doesn't hold as long as a four-line one. ~220ms a word is
 * roughly 270 words a minute — quick, because chat is skimmed rather than read.
 *
 * Clamped at both ends: below ~700ms the dots flash rather than register, and
 * above ~2.8s the wait reads as a stall however long the previous line was.
 * A step's own `pause` or `pauseFrom` still wins, for beats that are about
 * emphasis rather than reading.
 */
const MS_PER_WORD = 220;
const MIN_PAUSE = 700;
const MAX_PAUSE = 2800;
/** Cards and maps are scanned, not read, so they get a flat beat. */
const VISUAL_PAUSE = 900;

function readingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(MIN_PAUSE, Math.min(MAX_PAUSE, words * MS_PER_WORD));
}

/** Steps that display and move on without waiting for input. */
const PASSIVE: Step["kind"][] = ["say", "map", "grants"];

/** Everything needed to put the conversation back as it was. */
interface Snapshot {
  cursor: number;
  entries: Entry[];
  answers: Record<string, string>;
  address: string;
}

interface Entry {
  step: Step;
  /** The user's reply, echoed under the step that asked for it. */
  answer?: string;
  /** Address as it stood when this entry was made, so an earlier map in the
      transcript keeps showing the address it actually located. */
  address?: string;
  /** Resolved text for lines whose wording depends on earlier answers. */
  text?: string;
}

export function OnboardingFlow() {
  const { flow } = useParams<{ flow: string }>();
  const navigate = useNavigate();
  /* Re-read on the flow-edits event so an edit in another tab takes effect
     without a reload. */
  const [edits, setEdits] = useState(loadEdits);
  useEffect(() => {
    const sync = () => setEdits(loadEdits());
    window.addEventListener("flow-edits", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("flow-edits", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const script = editedScript(flow ?? "aid", edits) ?? editedScript("aid", edits);

  const reduced = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const [entries, setEntries] = useState<Entry[]>([]);
  const [address, setAddress] = useState(DEFAULT_ADDRESS);

  /* A stack of snapshots taken each time the person answers something.
     Recording the path travelled rather than counting indices backwards is
     what makes this work across the address loop, where the previous step by
     index isn't the step they actually came from. */
  const [history, setHistory] = useState<Snapshot[]>([]);
  /* Keyed by step id, so a later step can branch on an earlier answer. */
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [cursor, setCursor] = useState(0);
  const [typing, setTyping] = useState(false);
  const [instant, setInstant] = useState(reduced);
  /* Anchored on the newest message rather than the end of the thread — see
     useThreadScroll for why. */
  const anchorRef = useRef<HTMLDivElement>(null);

  const current = script.steps[cursor];
  const waiting = current && !PASSIVE.includes(current.kind);

  /* Reset when switching between flows. */
  useEffect(() => {
    setEntries([]);
    setAnswers({});
    setAddress(DEFAULT_ADDRESS);
    setHistory([]);
    setCursor(0);
  }, [script.id]);

  /* Advance through passive steps on a timer. */
  useEffect(() => {
    if (!current || waiting) return;
    /* A step can set its own pause; otherwise the wait is how long the message
       above it takes to read, so the conversation paces itself. */
    const previous = entries.at(-1);
    const prevText =
      previous?.step.kind === "say"
        ? typeof previous.step.text === "function"
          ? previous.step.text(answers)
          : previous.step.text
        : null;

    const derived = prevText ? readingTime(prevText) : VISUAL_PAUSE;

    const wait = instant
      ? 0
      : (current.kind === "say" && current.pauseFrom
          ? current.pauseFrom(answers)
          : (current.pause ?? derived));

    /* Dots run for the whole wait, whatever comes next — a two-second gap with
       nothing moving reads as a stall rather than as thinking. */
    if (!instant && wait >= 400) setTyping(true);
    const t = setTimeout(() => {
      setTyping(false);
      setEntries((e) => [
        ...e,
        {
          step: current,
          address,
          text:
            current.kind === "say" && typeof current.text === "function"
              ? current.text(answers)
              : undefined,
        },
      ]);
      setCursor((c) => c + 1);
    }, wait);
    return () => clearTimeout(t);
    /* entries is read for the previous message's length; the effect only fires
       on cursor changes, so this can't loop. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, current, waiting, instant, address, answers]);

  useThreadScroll(anchorRef, [entries.length, typing, cursor], { instant });

  /** Index of a labelled step, so a flow can jump instead of only advancing. */
  const indexOf = (label: string) =>
    script.steps.findIndex((s) => s.label === label);

  const answer = (v: string, jumpTo?: string) => {
    if (!current) return;
    setHistory((h) => [...h, { cursor, entries, answers, address }]);
    if ("id" in current && current.id) {
      setAnswers((a) => ({ ...a, [current.id]: v }));
    }
    /* A step reached more than once appends, so the flow can name everything
       collected rather than only the most recent answer. */
    if (current.accumulate) {
      const key = current.accumulate;
      setAnswers((a) => ({ ...a, [key]: a[key] ? `${a[key]}|${v}` : v }));
    }
    setEntries((e) => [...e, { step: current, answer: v, address }]);

    if (jumpTo) {
      const i = indexOf(jumpTo);
      setCursor(i >= 0 ? i : cursor + 1);
      return;
    }
    setCursor((c) => c + 1);
  };

  const done = cursor >= script.steps.length;

  /**
   * Step back to the last thing they were asked.
   *
   * Restores the whole snapshot rather than only moving the cursor, so the
   * transcript, the collected answers and the address all return to what they
   * were — otherwise going back would leave replies on screen for a question
   * being asked again, and a corrected address would survive its own undo.
   */
  const goBack = () => {
    const prev = history.at(-1);
    if (!prev) return;
    setHistory((h) => h.slice(0, -1));
    setTyping(false);
    setEntries(prev.entries);
    setAnswers(prev.answers);
    setAddress(prev.address);
    /* Lands on the step that was being asked, which is interactive, so
       nothing re-types on the way back and the typing setting is left alone. */
    setCursor(prev.cursor);
  };

  return (
    <div className="ob">
      <header className="ob__top">
        <button
          type="button"
          className="ob__back"
          onClick={() => navigate("/campaigns")}
          aria-label="Back to campaigns"
        >
          <ChevronLeft size={20} strokeWidth={2} aria-hidden="true" />
        </button>
        <div>
          <p className="ob__title">AidFinder</p>
          <p className="ob__src">{script.source}</p>
        </div>
        {!instant && !done && (
          <button
            type="button"
            className="ob__skip"
            onClick={() => setInstant(true)}
          >
            Skip typing
          </button>
        )}
      </header>

      <div className="ob__scroll">
        <div className="ob__thread">
          {entries.map((e, i) => (
            <div
              key={i}
              className="ob-entry"
              ref={i === entries.length - 1 ? anchorRef : undefined}
            >
              <StepView entry={e} />
            </div>
          ))}

          {typing && (
            <div className="ob-bubble ob-bubble--typing" aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
          )}

          {waiting && current && (
            <motion.div
              className="ob__active"
              initial={instant ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Interactive
                step={current}
                answers={answers}
                address={address}
                onDone={answer}
                onAddress={setAddress}
                onGo={navigate}
              />
            </motion.div>
          )}

        </div>
      </div>

      {/* Outside the scroller: one fixed position at the foot of the flow, so
          it can't scroll away mid-conversation or land in a different place
          on every step. Hidden at the start, when there's nothing behind. */}
      {history.length > 0 && !done && (
        <div className="ob__foot">
          <button type="button" className="ob__back-step" onClick={goBack}>
            <CornerUpLeft size={13} strokeWidth={2} aria-hidden="true" />
            Back
          </button>
        </div>
      )}
    </div>
  );
}

/** A settled entry: whatever the step rendered, plus the reply it drew. */
function StepView({ entry }: { entry: Entry }) {
  const { step, answer, address, text } = entry;
  return (
    <>
      {step.kind === "say" && (
        <motion.div
          className="ob-bubble"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {text ?? (typeof step.text === "string" ? step.text : "")}
        </motion.div>
      )}
      {step.kind === "map" && <MapStep address={address ?? DEFAULT_ADDRESS} />}
      {step.kind === "grants" && <GrantsStep />}
      {answer && <div className="ob-reply">{answer}</div>}
    </>
  );
}

function Interactive({
  step,
  answers,
  address,
  onDone,
  onAddress,
  onGo,
}: {
  step: Step;
  answers: Record<string, string>;
  address: string;
  onDone: (v: string, jumpTo?: string) => void;
  onAddress: (a: string) => void;
  onGo: (to: string) => void;
}) {
  switch (step.kind) {
    case "confirmAddress":
      return (
        <ConfirmAddressStep
          address={address}
          onConfirm={(v) => onDone(v, step.okTo)}
          onReject={() => onDone("That's not my address", step.retryTo)}
        />
      );
    case "askAddress":
      return (
        <AskAddressStep
          onDone={(a: string) => {
            onAddress(a);
            onDone(a, step.backTo);
          }}
        />
      );
    case "pickGrants":
      return <PickGrantsStep onDone={onDone} />;
    case "resiliency":
      return <ResiliencyStep onDone={onDone} />;
    case "choice":
      return (
        <ChoiceStep
          options={step.options}
          other={step.other}
          onDone={(v) => onDone(v, step.branch?.[v])}
        />
      );
    case "videoScan":
      return (
        <VideoScanStep
          onDone={(v, edit) => onDone(v, edit ? step.editTo : step.okTo)}
        />
      );
    case "uploadDoc":
      return <UploadDocStep onDone={onDone} />;
    case "moreDocs":
      return (
        <MoreDocsStep
          onDone={(v, again) => onDone(v, again ? step.againTo : step.doneTo)}
        />
      );
    case "property":
      /* The flow only needs the reply; the rebuild figure is used by the
         risk view, which opens the same panel with its own handler. */
      return <PropertyStep onDone={(v) => onDone(v)} />;
    case "risks":
      return <RisksStep onDone={onDone} />;
    case "insurance":
      return <InsuranceStep onDone={onDone} vehicle={step.vehicle} />;
    case "morePolicies":
      return (
        <MorePoliciesStep
          onDone={(v, again) => onDone(v, again ? step.againTo : step.doneTo)}
        />
      );
    case "text":
      return <TextStep placeholder={step.placeholder} onDone={onDone} />;
    case "account":
      return <AccountStep onDone={onDone} />;
    case "goto":
      return (
        <button
          type="button"
          className="ob-go"
          onClick={() =>
            onGo(typeof step.to === "function" ? step.to(answers) : step.to)
          }
        >
          {step.label}
          <ArrowRight size={17} strokeWidth={2} aria-hidden="true" />
        </button>
      );
    default:
      return null;
  }
}
