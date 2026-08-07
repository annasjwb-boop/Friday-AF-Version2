import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { MobileHeader } from "../components/mobile/MobileHeader";
import { AmbientShaderBackground } from "../components/mobile/AmbientShaderBackground";
import {
  AidFinderMark,
  DashboardAgentToggle,
} from "../components/mobile/DashboardAgentToggle";
import { IconButton } from "../components/ui/IconButton";
import { StarterCard } from "../components/assistant/StarterCard";
import { AssistantCardView } from "../components/assistant/AssistantCardView";
import { Composer } from "../components/assistant/Composer";
import {
  getStep,
  parseCurrency,
  SECTION_LABELS,
  START_STEP_ID,
} from "../data/assistantFlow";
import type {
  AssistantCard,
  AssistantProfile,
  StepInput,
  ThreadItem,
} from "../types/assistant";
import "./AssistantScreen.css";

type NewThreadItem =
  | { role: "agent" | "user"; text: string }
  | { role: "card"; card: AssistantCard }
  | { role: "divider"; label: string };

/** Conversation state survives toggling between dashboard and assistant. */
const store: {
  items: ThreadItem[];
  stepId: string | null;
  profile: AssistantProfile;
  lastSection: number;
  nextId: number;
} = { items: [], stepId: null, profile: {}, lastSection: 0, nextId: 1 };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function AssistantScreen() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ThreadItem[]>(store.items);
  const [stepId, setStepId] = useState<string | null>(store.stepId);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const alive = useRef(true);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    threadRef.current?.scrollTo({
      top: threadRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [items, typing, stepId]);

  const push = (item: NewThreadItem) => {
    const next: ThreadItem = { ...item, id: store.nextId++ };
    store.items = [...store.items, next];
    if (alive.current) setItems(store.items);
  };

  const setCurrentStep = (id: string | null) => {
    store.stepId = id;
    if (alive.current) setStepId(id);
  };

  const advanceTo = async (id: string) => {
    const step = getStep(id);
    setCurrentStep(null);

    if (step.section !== store.lastSection) {
      store.lastSection = step.section;
      push({ role: "divider", label: SECTION_LABELS[step.section] });
    }

    const messages = step.messages(store.profile);
    for (const text of messages) {
      if (alive.current) setTyping(true);
      await sleep(650);
      if (alive.current) setTyping(false);
      push({ role: "agent", text });
      await sleep(250);
    }

    const card = step.card?.(store.profile);
    if (card) {
      if (alive.current) setTyping(true);
      await sleep(700);
      if (alive.current) setTyping(false);
      push({ role: "card", card });
    }

    setCurrentStep(id);
  };

  const answer = (value: string, echo = value) => {
    if (!store.stepId) return;
    const step = getStep(store.stepId);
    push({ role: "user", text: echo });
    store.profile = step.apply?.(value, store.profile) ?? store.profile;
    const nextId = step.next(value, store.profile);
    if (nextId === "@dashboard") {
      setCurrentStep(null);
      navigate("/");
      return;
    }
    void advanceTo(nextId);
  };

  const start = (firstMessage?: string) => {
    if (firstMessage) push({ role: "user", text: firstMessage });
    void advanceTo(START_STEP_ID);
  };

  const input: StepInput | null = stepId ? getStep(stepId).input : null;
  const started = items.length > 0 || typing;
  const awaitingText =
    input?.kind === "text" || input?.kind === "currency";

  const placeholder =
    !started || !input
      ? "Ask anything"
      : awaitingText
        ? input.placeholder
        : "Ask anything";

  const handleSubmit = () => {
    const text = draft.trim();
    if (!text) return;

    if (!started) {
      setDraft("");
      start(text);
      return;
    }
    // Keep the draft while the agent is still responding.
    if (!input || typing) return;
    setDraft("");

    if (input.kind === "quickTaps") {
      // Forgiving match: typing "own", "single family", or "yes" should
      // land on the matching option without exact wording.
      const lower = text.toLowerCase();
      const match = input.taps.find((tap) => {
        const t = tap.toLowerCase();
        return t === lower || t.includes(lower) || lower.includes(t);
      });
      if (match) {
        answer(match);
      } else {
        push({ role: "user", text });
        void (async () => {
          setTyping(true);
          await sleep(600);
          setTyping(false);
          push({
            role: "agent",
            text: "I want to make sure I score this right — tap the option below that fits best.",
          });
        })();
      }
      return;
    }
    if (input.kind === "currency") {
      // Echo "715k" / "715000" back as "$715,000".
      const value = parseCurrency(text);
      answer(
        text,
        value != null
          ? `$${Math.round(value).toLocaleString("en-US")}`
          : text,
      );
      return;
    }
    answer(text);
  };

  return (
    <div className="assistant-screen">
      {/* Empty state: the shader glows up top. Once the conversation starts it
          fades away and the bottom band animates in behind the composer. */}
      <div
        className={`assistant-ambient assistant-ambient--top${
          !started ? " is-visible" : ""
        }`}
        aria-hidden="true"
      >
        <AmbientShaderBackground veil={false} />
        <div className="assistant-ambient__veil assistant-ambient__veil--top" />
      </div>
      <div
        className={`assistant-ambient assistant-ambient--bottom${
          started ? " is-visible" : ""
        }`}
        aria-hidden="true"
      >
        <AmbientShaderBackground veil={false} />
        <div className="assistant-ambient__veil" />
      </div>

      <MobileHeader
        title=""
        variant="transparent"
        leading={<DashboardAgentToggle />}
        trailing={
          <IconButton label="Menu">
            <Menu size={24} strokeWidth={2} aria-hidden="true" />
          </IconButton>
        }
      />

      {!started ? (
        <div className="assistant-hero">
          <div className="assistant-hero__brand">
            <AidFinderMark />
            <span>AidFinder</span>
          </div>
          <h2 className="assistant-hero__headline">
            Be Ready Before
            <br />
            Recovery Starts.
          </h2>
          <StarterCard onStart={() => start()} />
        </div>
      ) : (
        <div className="assistant-thread" ref={threadRef}>
          {items.map((item) => {
            if (item.role === "divider") {
              return (
                <div key={item.id} className="assistant-divider">
                  {item.label}
                </div>
              );
            }
            if (item.role === "card") {
              return (
                <div key={item.id} className="assistant-card-slot">
                  <AssistantCardView card={item.card} />
                </div>
              );
            }
            return (
              <p
                key={item.id}
                className={`assistant-bubble assistant-bubble--${item.role}`}
              >
                {item.text}
              </p>
            );
          })}

          {typing && (
            <span className="assistant-typing" aria-label="Assistant is typing">
              <span />
              <span />
              <span />
            </span>
          )}

          {!typing && input?.kind === "quickTaps" && (
            <div className="assistant-taps">
              {input.taps.map((tap) => (
                <button
                  key={tap}
                  type="button"
                  className="assistant-tap"
                  onClick={() => answer(tap)}
                >
                  {tap}
                </button>
              ))}
            </div>
          )}

          {!typing &&
            input &&
            input.kind !== "quickTaps" &&
            (input.chips?.length ?? 0) > 0 && (
              <div className="assistant-taps">
                {input.chips!.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    className="assistant-tap"
                    onClick={() => answer(chip.value ?? chip.label, chip.label)}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}
        </div>
      )}

      <Composer
        value={draft}
        placeholder={placeholder}
        autoFocus={awaitingText}
        inputMode={input?.kind === "currency" ? "decimal" : "text"}
        onChange={setDraft}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
