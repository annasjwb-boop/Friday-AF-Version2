import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Share2 } from "lucide-react";
import type { ReadinessSection } from "../../data/vaultSections";
import "./VaultSections.css";

/* ---------------------------------------------------------------------------
 * Readiness by section.
 *
 * Collapsed shows how far along each section is; expanded shows what's inside
 * and what you can do with it. Empty sections stay visible rather than being
 * hidden until started — "Home access: not started" is the useful state, since
 * nobody thinks about shutoff locations until an adjuster asks for them.
 * ------------------------------------------------------------------------- */

const PILL: Record<string, string> = {
  complete: "Complete",
  started: "In progress",
  empty: "Not started",
};

export function VaultSections({
  sections,
  onOpenDocs,
}: {
  sections: ReadinessSection[];
  onOpenDocs: () => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const complete = sections.filter((s) => s.status === "complete").length;

  return (
    <section className="vs" aria-label="Your readiness by section">
      <header className="vs__top">
        <h2 className="vs__title">Your readiness by section</h2>
        <span className="vs__count">
          {complete} of {sections.length} complete
        </span>
      </header>

      {sections.map((s) => {
        const open = openId === s.id;
        const pct = s.total === 0 ? 0 : (s.done / s.total) * 100;
        return (
          <div className={`vs-row vs-row--${s.status}`} key={s.id}>
            <button
              type="button"
              className="vs-row__head"
              aria-expanded={open}
              onClick={() => setOpenId(open ? null : s.id)}
            >
              <span className="vs-row__id">
                <span className="vs-row__name">{s.name}</span>
                <span className="vs-row__sub">{s.sub}</span>
              </span>
              <span className="vs-row__meter" aria-hidden="true">
                <i style={{ width: `${pct}%` }} />
              </span>
              <span className="vs-row__pill">{PILL[s.status]}</span>
              <ChevronDown size={16} strokeWidth={2} className="vs-row__chev" />
            </button>

            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  className="vs-row__body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                >
                  <div className="vs-row__inner">
                    {s.items.map((item) => (
                      <div className="vs-item" key={item.name}>
                        <span className="vs-item__id">
                          <span className="vs-item__name">{item.name}</span>
                          <span className="vs-item__meta">{item.meta}</span>
                        </span>
                        <span className="vs-item__acts">
                          {item.done ? (
                            <>
                              <button type="button" onClick={onOpenDocs}>
                                Open
                              </button>
                              <button type="button" onClick={onOpenDocs}>
                                Swap
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="is-primary"
                              onClick={onOpenDocs}
                            >
                              Add
                            </button>
                          )}
                        </span>
                      </div>
                    ))}

                    <button type="button" className="vs-row__share">
                      <Share2 size={14} strokeWidth={1.9} aria-hidden="true" />
                      Share with a helper
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      <p className="vs__foot">
        Link state records to add documents automatically where they exist.
      </p>
    </section>
  );
}
