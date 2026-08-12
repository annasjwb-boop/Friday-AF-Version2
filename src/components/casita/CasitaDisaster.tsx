import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  FileUp,
  Video,
  Wrench,
  X,
} from "lucide-react";
import {
  APPLICATIONS,
  APP_STATUS_LABEL,
  CONDITION_LABEL,
  DAMAGE_CATEGORIES,
  DAMAGE_ITEMS,
  FEED,
  PROFILE_FACTS,
  STAGES,
  extrasTotal,
  itemLoss,
  money,
  structuralTotal,
  type Condition,
  type DamageItem,
} from "../../data/disaster";
import { InspectorSheet } from "./InspectorSheet";
import { SubmitSheet } from "./SubmitSheet";
import { VideoScanStep } from "../../onboarding/steps";
import { RecoveryVariants } from "./RecoveryVariants";
import "./RecoveryPlanBlock.css";
import "./CasitaDisaster.css";

/* ---------------------------------------------------------------------------
 * Disaster mode: what happened, what pays for it, and applying.
 *
 * The behaviour is ported from the standalone prototype — marking each item's
 * condition, choosing programs against a funding bar, and preparing every
 * application from one profile. What changes is that it lives in the app's own
 * language rather than the deck's, and that the three steps are tabs inside one
 * screen rather than three pages.
 *
 * The loan question is kept exactly as it was, because it is the sharpest thing
 * in the original: an SBA loan closes the gap on the bar without reducing what
 * the household eventually pays, and asking up front is the only honest way to
 * show it in the same list as grants.
 * ------------------------------------------------------------------------- */

export type DisasterSection = "damage" | "plan" | "apply";

/** Which section shows is decided by the main tab strip, not by this view. */
export function CasitaDisaster({
  section,
  onExit,
  onSection,
}: {
  section: DisasterSection;
  onExit: () => void;
  onSection: (s: DisasterSection) => void;
}) {
  const [items, setItems] = useState<DamageItem[]>(DAMAGE_ITEMS);
  const [cats] = useState(DAMAGE_CATEGORIES);
  const [openApp, setOpenApp] = useState<string | null>(null);
  const [profileApplied, setProfileApplied] = useState(false);
  const [docsLoaded, setDocsLoaded] = useState(false);
  /* Both open over the whole view: recording and choosing a contractor are
     each a task in their own right, not a control on this page. */
  const [recording, setRecording] = useState(false);
  const [findingPro, setFindingPro] = useState(false);
  const [submitting, setSubmitting] = useState<{
    id: string;
    name: string;
  } | null>(null);
  /* Status stays as filed rather than flipping on open: the sheet is where
     the application is reviewed, and it is only submitted at the end of it. */
  /* Reviewing a draft moves that row to Ready, which is the one status change
     the person actually causes from here. */
  const [apps, setApps] = useState(APPLICATIONS);
  const [reviewed, setReviewed] = useState<string[]>([]);

  const extras = extrasTotal(cats);
  const documented = structuralTotal(cats) + itemLoss(items) + extras;

  const setCond = (id: string, cond: Condition) =>
    setItems((all) => all.map((i) => (i.id === id ? { ...i, cond } : i)));



  return (
    <div className="dis">
      {section === "damage" && (
        <>
          <p className="dis__eyebrow">Damage documentation · Hurricane Elena</p>
          <h2 className="dis__title">
            Document everything before you clean up. Insurance and aid programs
            pay for what you can prove.
          </h2>

          {/* The primary action, above the numbers rather than buried in a
              card below them. Everything on this screen depends on it having
              been done. */}
          <button
            type="button"
            className="dis-record"
            onClick={() => setRecording(true)}
          >
            <span className="dis-record__icon" aria-hidden="true">
              <Video size={19} strokeWidth={1.9} />
            </span>
            <span className="dis-record__body">
              <span className="dis-record__title">Record your damage</span>
              <span className="dis-record__sub">
                Walk each room and say what happened out loud — where the water
                reached, what it ruined, what was already broken. Your voice
                becomes the record, and we price it against what you owned.
              </span>
              <span className="dis-record__meta">
                2 of 6 rooms still need a post-storm pass
              </span>
            </span>
          </button>

          {/* Documented damage and the flagged-items count are hidden. The
              items list below shows the same total building up as conditions
              are marked, which is where the number means something. */}
          <section className="dis-card">
            <h3>Other evidence</h3>
            <p className="dis-card__sub">
              What strengthens a claim beyond your own footage.
            </p>
            <div className="dis-act">
              <span className="dis-act__icon" aria-hidden="true">
                <Wrench size={16} strokeWidth={1.9} />
              </span>
              <span>
                <b>Damage looks significant</b>
                <em>
                  A licensed contractor estimate strengthens FEMA and SBA awards
                </em>
              </span>
              <button type="button" onClick={() => setFindingPro(true)}>
                Request
              </button>
            </div>
            <button type="button" className="dis-upload">
              <FileUp size={15} strokeWidth={1.9} aria-hidden="true" />
              Upload evidence
            </button>
          </section>

          <section className="dis-card">
            <h3>Your belongings — mark their condition</h3>
            <p className="dis-card__sub">
              Pulled from your asset library, values already proven.
            </p>
            {items.map((it) => (
              <div className="dis-item" key={it.id}>
                <p className="dis-item__name">{it.name}</p>
                <p className="dis-item__meta">
                  {it.room} · pre-storm {money(it.pre)} · est. loss{" "}
                  {it.cond === "ok" ? "$0" : money(it.est)}
                </p>
                <div
                  className="dis-conds"
                  role="radiogroup"
                  aria-label={`Condition for ${it.name}`}
                >
                  {(["dest", "major", "minor", "ok"] as Condition[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      role="radio"
                      aria-checked={it.cond === c}
                      className={`dis-cond${
                        it.cond === c ? ` is-on is-${c}` : ""
                      }`}
                      onClick={() => setCond(it.id, c)}
                    >
                      {CONDITION_LABEL[c]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <section className="dis-card">
            <h3>Beyond the house</h3>
            <p className="dis-card__sub">
              Vehicles, access and the costs that pile up — what FEMA's Other
              Needs Assistance is for.
            </p>
            {cats.map((c) => (
              <div className="dis-row" key={c.id}>
                <span className="dis-row__id">
                  <b>{c.name}</b>
                  <em>{c.sub}</em>
                </span>
                <span className="dis-row__amt">
                  {c.done ? money(c.amt) : "—"}
                </span>
                <span
                  className={`dis-row__tag${c.done ? " is-done" : ""}`}
                >
                  {c.done ? "Logged" : "Add"}
                </span>
              </div>
            ))}
          </section>

          <button
            type="button"
            className="dis-next"
            onClick={() => onSection("plan")}
          >
            Build my recovery plan
          </button>
        </>
      )}

      {section === "plan" && <RecoveryVariants />}

      {section === "apply" && (
        <>
          <p className="dis__eyebrow">Apply &amp; track</p>
          <h2 className="dis__title">Every application, prepared at once</h2>

          <section className="dis-card dis-card--ask">
            <h3>Answer once, apply everywhere</h3>
            <p className="dis-card__sub">
              The same answers and documents fill FEMA, SBA, IRS and state forms
              at the same time.
            </p>
            <div className="dis-facts">
              {PROFILE_FACTS.map((f) => (
                <span key={f}>
                  <Check size={12} strokeWidth={3} aria-hidden="true" />
                  {f}
                </span>
              ))}
            </div>
            <div className="dis-ask">
              <button
                type="button"
                className={profileApplied ? "is-done" : undefined}
                onClick={() => setProfileApplied(true)}
              >
                {profileApplied ? "Profile applied" : "Apply profile details"}
              </button>
              <button
                type="button"
                className={docsLoaded ? "is-done" : undefined}
                onClick={() => setDocsLoaded(true)}
              >
                {docsLoaded ? "Vault documents loaded" : "Load docs from vault"}
              </button>
            </div>
          </section>

          <div className="dis-stepper">
            {STAGES.map(([label, state]) => (
              <div className={`dis-step is-${state || "todo"}`} key={label}>
                <i aria-hidden="true">
                  {state === "done" && <Check size={10} strokeWidth={3.4} />}
                </i>
                <span>{label}</span>
              </div>
            ))}
          </div>

          <section className="dis-card">
            <h3>Your applications</h3>
            {apps.map((ap) => {
              const open = openApp === ap.id;
              return (
                <div className="dis-app" key={ap.id}>
                  <button
                    type="button"
                    className="dis-app__head"
                    aria-expanded={open}
                    onClick={() => setOpenApp(open ? null : ap.id)}
                  >
                    <span className="dis-row__id">
                      <b>{ap.name}</b>
                      <em>{ap.line}</em>
                    </span>
                    <span
                      className={`dis-app__status is-${
                        reviewed.includes(ap.id) ? "reviewed" : ap.status
                      }`}
                    >
                      {reviewed.includes(ap.id)
                        ? "Ready"
                        : APP_STATUS_LABEL[ap.status]}
                    </span>
                    <ChevronDown
                      size={15}
                      strokeWidth={2}
                      className="dis-app__chev"
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        className="dis-app__body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                      >
                        <p>{ap.docs}</p>
                        {/* Stays reachable once it's running: the sheet can be
                            closed mid-fill, and without this there'd be no way
                            back to a submission already under way. */}
                        {ap.status === "ready" && !reviewed.includes(ap.id) && (
                          <button
                            type="button"
                            className="dis-prog__cta is-on"
                            onClick={() =>
                              setSubmitting({ id: ap.id, name: ap.name })
                            }
                          >
                            Review &amp; submit
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </section>

          <section className="dis-card">
            <h3>Alerts &amp; next actions</h3>
            {FEED.map((f) => (
              <div className="dis-feed" key={f.title}>
                <span className={`dis-feed__dot is-${f.tone}`} />
                <div>
                  <b>{f.title}</b>
                  <p>{f.body}</p>
                  {f.cta && <span className="dis-feed__cta">{f.cta} →</span>}
                </div>
                <span className="dis-feed__time">{f.time}</span>
              </div>
            ))}
            <p className="dis-card__sub">
              New programs come online as the disaster evolves — we watch, you
              get one alert, the package is pre-built.
            </p>
          </section>
        </>
      )}

      <button type="button" className="dis-exit" onClick={onExit}>
        Leave disaster mode
      </button>

      <AnimatePresence>
        {recording && (
          <motion.div
            className="dis-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
          >
            <header className="dis-sheet__top">
              <h2>Walk a room</h2>
              <button
                type="button"
                onClick={() => setRecording(false)}
                aria-label="Close"
              >
                <X size={19} strokeWidth={2} aria-hidden="true" />
              </button>
            </header>
            <div className="dis-sheet__body">
              {/* The same walkthrough the vault uses. After a storm it is
                  recording damage rather than inventory, but the task and the
                  output are identical, so it would be strange to build a
                  second one. */}
              <VideoScanStep onDone={() => setRecording(false)} />
            </div>
          </motion.div>
        )}

        {submitting && (
          <SubmitSheet
            name={submitting.name}
            onClose={() => setSubmitting(null)}
            onReviewed={() => {
              setReviewed((r) => [...r, submitting.id]);
              setApps((all) =>
                all.map((a) =>
                  a.id === submitting.id
                    ? { ...a, line: "Reviewed · ready to send" }
                    : a,
                ),
              );
            }}
          />
        )}

        {findingPro && (
          <InspectorSheet
            damage={documented}
            address="1200 Edwards Dr, Fort Myers, FL"
            onClose={() => setFindingPro(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
