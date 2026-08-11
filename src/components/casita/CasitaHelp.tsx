import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Play, Sparkles, Video, X } from "lucide-react";
import {
  EXPLAINERS,
  answersFor,
  type Answer,
  type HelpContext,
} from "../../data/help";
import { useThreadScroll } from "../../hooks/useThreadScroll";
import "./CasitaHelp.css";

/* ---------------------------------------------------------------------------
 * Help, from the header, on every view.
 *
 * Both sheets are context-aware: they take whichever tab is open and offer the
 * explainers and questions that belong to it. Generic help on a screen full of
 * specific numbers is the kind of thing people learn to ignore.
 * ------------------------------------------------------------------------- */

export function CasitaHelp({ context }: { context: HelpContext }) {
  const [open, setOpen] = useState<null | "video" | "chat">(null);

  return (
    <>
      <button
        type="button"
        className="ch-btn"
        aria-label="Watch an explainer about this screen"
        onClick={() => setOpen("video")}
      >
        <Video size={17} strokeWidth={1.9} aria-hidden="true" />
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
          <Sheet title="Explainers" onClose={() => setOpen(null)}>
            <p className="ch__lede">
              Short videos about what's on this screen.
            </p>
            {EXPLAINERS[context].map((e) => (
              <div className="ch-vid" key={e.id}>
                <span className="ch-vid__thumb" aria-hidden="true">
                  <Play size={16} strokeWidth={2} />
                </span>
                <span className="ch-vid__body">
                  <span className="ch-vid__title">{e.title}</span>
                  <span className="ch-vid__blurb">{e.blurb}</span>
                  <span className="ch-vid__meta">
                    {e.length} · not recorded yet
                  </span>
                </span>
              </div>
            ))}
            <p className="ch__note">
              These are planned, not made. Titles and runtimes are here so the
              library can be reviewed before anything is filmed.
            </p>
          </Sheet>
        )}

        {open === "chat" && (
          <Sheet title="Ask about this" onClose={() => setOpen(null)}>
            <Chat context={context} />
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
