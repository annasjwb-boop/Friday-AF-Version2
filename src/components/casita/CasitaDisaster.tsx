import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  FileUp,
  Users,
  Video,
  Wrench,
} from "lucide-react";
import {
  APPLICATIONS,
  APP_STATUS_LABEL,
  CONDITION_LABEL,
  DAMAGE_CATEGORIES,
  DAMAGE_ITEMS,
  FEED,
  PROFILE_FACTS,
  PROGRAMS,
  SAVINGS,
  STAGES,
  TAG_LABEL,
  extrasTotal,
  itemLoss,
  money,
  structuralTotal,
  type Condition,
  type DamageItem,
  type Program,
} from "../../data/disaster";
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
  const [programs, setPrograms] = useState<Program[]>(PROGRAMS);
  const [loanOK, setLoanOK] = useState<boolean | null>(null);
  const [openApp, setOpenApp] = useState<string | null>(null);
  const [profileApplied, setProfileApplied] = useState(false);
  const [docsLoaded, setDocsLoaded] = useState(false);

  const extras = extrasTotal(cats);
  const documented = structuralTotal(cats) + itemLoss(items) + extras;
  const need = documented;
  const funded =
    programs.filter((p) => p.added).reduce((n, p) => n + p.amt, 0) + SAVINGS;
  const gap = Math.max(need - funded, 0);

  const setCond = (id: string, cond: Condition) =>
    setItems((all) => all.map((i) => (i.id === id ? { ...i, cond } : i)));

  const toggle = (id: string) =>
    setPrograms((all) =>
      all.map((p) => (p.id === id ? { ...p, added: !p.added } : p)),
    );

  /* Loans sink to the bottom when the household has said grants only, rather
     than disappearing — the option is still theirs to change. */
  const ordered =
    loanOK === false
      ? [...programs].sort((a, b) => (a.loan ? 1 : 0) - (b.loan ? 1 : 0))
      : programs;

  return (
    <div className="dis">
      {section === "damage" && (
        <>
          <p className="dis__eyebrow">Damage documentation · Hurricane Elena</p>
          <h2 className="dis__title">Document everything before you clean up</h2>
          <p className="dis__lede">
            Tell your story once — this feeds every application.
          </p>

          <div className="dis-stats">
            <div className="dis-stat dis-stat--hi">
              <span>Documented damage</span>
              <b>{money(documented)}</b>
              <em>Structure, contents, vehicle, exterior & extra costs</em>
            </div>
            <div className="dis-stat">
              <span>Items flagged from your library</span>
              <b>
                {items.filter((i) => i.cond !== "ok").length}
                <i> of {items.length}</i>
              </b>
              <em>Pre-disaster values already on file</em>
            </div>
          </div>

          <section className="dis-card">
            <h3>Room walkthroughs</h3>
            <p className="dis-card__sub">
              Film a slow pan — we grab a frame of each damaged item.
            </p>
            <div className="dis-act">
              <span className="dis-act__icon" aria-hidden="true">
                <Video size={16} strokeWidth={1.9} />
              </span>
              <span>
                <b>Walk the next room</b>
                <em>2 of 6 rooms still need a post-storm pass</em>
              </span>
              <button type="button">Record</button>
            </div>
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
              <button type="button">Request</button>
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

      {section === "plan" && (
        <>
          <p className="dis__eyebrow">Recovery plan · actual damages</p>
          <h2 className="dis__title">
            Pick the path that funds your {money(need)} recovery
          </h2>

          <div className="dis-fund">
            <div className="dis-fund__bar">
              <motion.i
                animate={{ width: `${Math.min(funded / need, 1) * 100}%` }}
                transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
              />
            </div>
            <p className="dis-fund__cap">
              <span>{money(Math.min(funded, need))} funded</span>
              <span>{money(need)} needed</span>
            </p>
            <p className={`dis-fund__gap${gap > 0 ? "" : " is-closed"}`}>
              {gap > 0
                ? `${money(gap)} still to find`
                : "This plan fully funds your recovery"}
            </p>
          </div>

          {loanOK === null && (
            <section className="dis-card dis-card--ask">
              <h3>One question shapes your plan</h3>
              <p className="dis-card__sub">
                Are you open to a low-interest federal loan, or would you rather
                stick to grants and cash?
              </p>
              <div className="dis-ask">
                <button type="button" onClick={() => setLoanOK(true)}>
                  Open to a loan
                </button>
                <button type="button" onClick={() => setLoanOK(false)}>
                  Grants &amp; cash only
                </button>
              </div>
            </section>
          )}

          <section className="dis-card">
            <h3>Support options</h3>
            <p className="dis-card__sub">
              Matched to flood damage, no flood policy, and your county's
              declaration.
            </p>
            {ordered.map((p) => (
              <article
                className={`dis-prog${p.added ? " is-added" : ""}${
                  p.na ? " is-na" : ""
                }`}
                key={p.id}
              >
                <div className="dis-prog__top">
                  <span className={`dis-prog__tag is-${p.tag}`}>
                    {TAG_LABEL[p.tag]}
                  </span>
                  {p.amt > 0 && (
                    <span className="dis-prog__amt">{money(p.amt)}</span>
                  )}
                </div>
                <p className="dis-prog__name">{p.name}</p>
                <p className="dis-prog__up">{p.up}</p>
                <p className="dis-prog__desc">{p.desc}</p>
                {p.loan && (
                  <p className="dis-prog__warn">
                    A loan closes the gap on the bar above without reducing what
                    you eventually pay.
                  </p>
                )}
                {p.na ? (
                  <button type="button" className="dis-prog__cta" disabled={!p.watch}>
                    {p.watch ? "Notify me when it opens" : "Not available"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`dis-prog__cta${p.added ? " is-on" : ""}`}
                    onClick={() => toggle(p.id)}
                  >
                    {p.added ? "Added to plan — remove" : "Add to plan"}
                  </button>
                )}
              </article>
            ))}
          </section>

          <section className="dis-card">
            <h3>Personal resources</h3>
            <div className="dis-row">
              <span className="dis-row__id">
                <b>Savings / cash</b>
                <em>Counted in your plan</em>
              </span>
              <span className="dis-row__amt">{money(SAVINGS)}</span>
            </div>
            {[
              ["Emergency fund", "Reserves set aside for crises"],
              ["Family support", "Gifts or loans from family"],
              ["Credit / HELOC", "Borrow against credit or equity"],
              ["Retirement funds", "401(k) or IRA — last resort"],
            ].map(([name, sub]) => (
              <div className="dis-row" key={name}>
                <span className="dis-row__id">
                  <b>{name}</b>
                  <em>{sub}</em>
                </span>
                <span className="dis-row__amt is-empty">+</span>
              </div>
            ))}
          </section>

          <section className="dis-card dis-card--voad">
            <span className="dis-act__icon" aria-hidden="true">
              <Users size={16} strokeWidth={1.9} />
            </span>
            <div>
              <b>Complex situation?</b>
              <p>
                No insurance and credit trouble, life-safety needs, immigration
                questions — talk to a local advisor by video.
              </p>
            </div>
          </section>

          <button
            type="button"
            className="dis-next"
            onClick={() => onSection("apply")}
          >
            Looks right — prepare my applications
          </button>
        </>
      )}

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
            {APPLICATIONS.map((ap) => {
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
                    <span className={`dis-app__status is-${ap.status}`}>
                      {APP_STATUS_LABEL[ap.status]}
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
                        {ap.status === "ready" && (
                          <button type="button" className="dis-prog__cta is-on">
                            Review &amp; sign
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
    </div>
  );
}
