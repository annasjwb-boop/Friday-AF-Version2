import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronUp, Lightbulb, Play, Sparkles, X } from "lucide-react";
import { answersFor, type Answer, type HelpContext } from "../../data/help";
import {
  TIPS,
  TIP_CATEGORY_LABEL,
  TIP_VIEW_LABEL,
  tipsFor,
  type TipCategory,
  type TipView,
} from "../../data/tips";
import { useThreadScroll } from "../../hooks/useThreadScroll";
import "./CasitaHelp.css";

/* ---------------------------------------------------------------------------
 * Help, from the header, on every view.
 *
 * Both sheets are context-aware: they take whichever tab is open and offer the
 * explainers and questions that belong to it. Generic help on a screen full of
 * specific numbers is the kind of thing people learn to ignore.
 * ------------------------------------------------------------------------- */

const ANSWER_CONTEXTS: HelpContext[] = [
  "overview",
  "risk",
  "readiness",
  "recovery",
];

export function CasitaHelp({ context }: { context: TipView }) {
  /* Tips are keyed per screen including the disaster tabs; the answer sheet
     only has content for the four preparedness contexts, so anything else
     falls back to recovery. */
  const answerContext: HelpContext = ANSWER_CONTEXTS.includes(
    context as HelpContext,
  )
    ? (context as HelpContext)
    : "recovery";
  const [open, setOpen] = useState<null | "video" | "chat">(null);

  return (
    <>
      <button
        type="button"
        className="ch-btn"
        aria-label="Watch an explainer about this screen"
        onClick={() => setOpen("video")}
      >
        <Lightbulb size={17} strokeWidth={1.9} aria-hidden="true" />
      </button>
      <button
        type="button"
        className="ch-btn"
        aria-label="Ask about this screen"
        onClick={() => setOpen("chat")}
      >
        <Sparkles size={17} strokeWidth={1.9} aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open === "video" && (
          <Sheet title="From people who've been through it" onClose={() => setOpen(null)}>
            <Tips view={context} />
          </Sheet>
        )}

        {open === "chat" && (
          <Sheet title="Ask about this" onClose={() => setOpen(null)}>
            <Chat context={answerContext} />
          </Sheet>
        )}
      </AnimatePresence>
    </>
  );
}

function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const host = document.getElementById("app-viewport");

  const panel = (
    <motion.div
      className="ch"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
    >
      <header className="ch__top">
        <h2 className="ch__title">{title}</h2>
        <button
          type="button"
          className="ch__close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={19} strokeWidth={2} aria-hidden="true" />
        </button>
      </header>
      <div className="ch__scroll">{children}</div>
    </motion.div>
  );

  return host ? createPortal(panel, host) : panel;
}

/**
 * Tap a question, get the answer.
 *
 * No free-text field: there's no model behind this, and an input that quietly
 * did nothing would be worse than not offering one. The answers themselves are
 * computed from live state — see data/help.ts.
 */
function Chat({ context }: { context: HelpContext }) {
  const [asked, setAsked] = useState<Answer[]>([]);
  /* Answers here run long, so the same rule applies: open at the question,
     not at the tail of the reply. */
  const anchorRef = useRef<HTMLDivElement>(null);
  useThreadScroll(anchorRef, [asked.length]);
  const all = answersFor(context);
  const remaining = all.filter((a) => !asked.includes(a));

  return (
    <div className="ch-chat">
      {asked.map((a, i) => (
        <div key={a.q} ref={i === asked.length - 1 ? anchorRef : undefined}>
          <p className="ch-chat__q">{a.q}</p>
          <motion.p
            className="ch-chat__a"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {a.a}
          </motion.p>
        </div>
      ))}

      {remaining.length > 0 && (
        <div className="ch-chat__asks">
          {remaining.map((a) => (
            <button
              key={a.q}
              type="button"
              onClick={() => setAsked((prev) => [...prev, a])}
            >
              {a.q}
            </button>
          ))}
        </div>
      )}

      <p className="ch__note">
        Answers are worked out from what's on your screen. Free-form questions
        aren't wired up in this prototype.
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Tips, filtered to the screen the person is on.
 *
 * The filter opens on the screen the person came from, named — "Risk Score",
 * "Damage" — rather than on "All". Someone who taps the lightbulb on the
 * damage view wants the tip about photographing before cleanup, not ten tips
 * of which one applies. Every other filter stays one tap away, and the count
 * on each makes it obvious what widening will do.
 * ------------------------------------------------------------------------- */

function Tips({ view }: { view: TipView }) {
  const [filter, setFilter] = useState<"view" | "all" | TipCategory>("view");
  const [voted, setVoted] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [draft, setDraft] = useState({ title: "", body: "" });
  const [sent, setSent] = useState(false);

  const relevant = tipsFor(view);
  const list =
    filter === "view"
      ? relevant
      : filter === "all"
        ? [...TIPS].sort((a, b) => b.votes - a.votes)
        : TIPS.filter((t) => t.category === filter).sort(
            (a, b) => b.votes - a.votes,
          );

  const filters: [typeof filter, string, number][] = [
    /* Named for the screen rather than "This screen", so it's obvious the
       tips are the ones relevant to where the person just was. */
    ["view", TIP_VIEW_LABEL[view], relevant.length],
    ["all", "All", TIPS.length],
    ...(Object.keys(TIP_CATEGORY_LABEL) as TipCategory[]).map(
      (c) =>
        [c, TIP_CATEGORY_LABEL[c], TIPS.filter((t) => t.category === c).length] as [
          typeof filter,
          string,
          number,
        ],
    ),
  ];

  return (
    <>
      <p className="ch__lede">
        Shared by past disaster survivors and the AidFinder team, checked by the
        people who ran the programs. Vote for what helped you.
      </p>

      <div className="ch-filters" role="tablist" aria-label="Filter tips">
        {filters.map(([id, label, count]) => (
          <button
            key={String(id)}
            type="button"
            role="tab"
            aria-selected={filter === id}
            className={`ch-filter${filter === id ? " is-on" : ""}`}
            onClick={() => setFilter(id)}
          >
            {label}
            <em>{count}</em>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="ch__note">
          Nothing filed under this yet. Try another filter.
        </p>
      ) : (
        list.map((t) => {
          const up = voted.includes(t.id);
          return (
            <article className="ch-tip" key={t.id}>
              <div className="ch-tip__who">
                <span className="ch-tip__av" aria-hidden="true">
                  {t.initials}
                </span>
                {t.source}
              </div>
              <button
                type="button"
                className="ch-tip__open"
                aria-expanded={open === t.id}
                onClick={() => setOpen(open === t.id ? null : t.id)}
              >
                <span className="ch-tip__title">{t.title}</span>
                <span className="ch-tip__body">{t.body}</span>
              </button>

              <AnimatePresence initial={false}>
                {open === t.id && (
                  <motion.div
                    className="ch-tip__more"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                  >
                    <div className="ch-tip__inner">
                      <button
                        type="button"
                        className="ch-video"
                        style={{
                          background: `linear-gradient(150deg, ${t.video.tint[0]}, ${t.video.tint[1]})`,
                        }}
                      >
                        <span className="ch-video__len">{t.video.length}</span>
                        <span className="ch-video__play" aria-hidden="true">
                          <Play size={17} strokeWidth={2.4} />
                        </span>
                        <span className="ch-video__cap">
                          <b>{t.video.title}</b>
                          <em>{t.video.presenter}</em>
                        </span>
                      </button>

                      <p className="ch-tip__detail">{t.detail}</p>

                      <button type="button" className="ch-tip__cta">
                        {t.cta}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="ch-tip__foot">
                {/* A survivor's storm and date says where the advice comes
                    from; the verification line is for tips without one. */}
                <span
                  className={`ch-tip__badge${
                    t.survivedName ? " is-survivor" : t.pending ? " is-pending" : ""
                  }`}
                >
                  {t.survivedName
                    ? `${t.survivedName} survivor, ${t.survivedWhen}`
                    : t.verified}
                </span>
                <button
                  type="button"
                  className={`ch-tip__vote${up ? " is-on" : ""}`}
                  aria-pressed={up}
                  onClick={() =>
                    setVoted((v) =>
                      up ? v.filter((x) => x !== t.id) : [...v, t.id],
                    )
                  }
                >
                  <ChevronUp size={13} strokeWidth={2.6} aria-hidden="true" />
                  {(t.votes + (up ? 1 : 0)).toLocaleString()}
                </button>
              </div>
            </article>
          );
        })
      )}

      {/* Anyone reading these has been through something the next person
          hasn't. The form is short on purpose — a long one collects nothing. */}
      <section className="ch-add">
        <h4>Leave a tip of your own</h4>
        {sent ? (
          <p className="ch-add__done">
            Thank you — it goes to the review queue, and a former program
            official checks it before anyone else sees it.
          </p>
        ) : (
          <>
            <p className="ch-add__sub">
              Something you wish someone had told you. It's checked before it
              appears.
            </p>
            <input
              value={draft.title}
              placeholder="What you learned, in a line"
              aria-label="Your tip's headline"
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
            <textarea
              value={draft.body}
              rows={4}
              placeholder="What happened, and what you'd do differently"
              aria-label="Your tip"
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            />
            <button
              type="button"
              className="ch-add__send"
              disabled={!draft.title.trim() || !draft.body.trim()}
              onClick={() => setSent(true)}
            >
              Submit for review
            </button>
          </>
        )}
      </section>

      <p className="ch__note">
        Survivor tips are experiences, not program guarantees — caps and rules
        change, so check them each year.
      </p>
    </>
  );
}
