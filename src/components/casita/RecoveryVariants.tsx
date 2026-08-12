import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Play,
  Plus,
  Search,
  X,
} from "lucide-react";
import {
  DOCUMENTED_DAMAGE,
  MONEY_LABEL,
  NEED_LABEL,
  OWN_MONEY,
  PROGRAMS,
  searchPrograms,
  type Need,
  type Program,
} from "../../data/programs";
import { money } from "./protection";
import "./RecoveryVariants.css";

/* ---------------------------------------------------------------------------
 * Seven ways to build a recovery plan.
 *
 * They differ in what they make easy, not in decoration:
 *
 *   receipt    everything adding up down one column
 *   model      deep controls — model the loan, split the grant
 *   deck       one programme at a time, in full
 *   waterfall  the order money arrives in, and why it matters
 *   compare    grants-only against grants-plus-loans, over time
 *   timeline   when money lands, not just how much
 *   needs      allocate by what's broken rather than by programme
 *
 * All seven share one selection and one catalogue, so switching view never
 * loses the plan.
 * ------------------------------------------------------------------------- */

const VARIANTS = [
  { id: "plan", label: "Plan" },
  { id: "receipt", label: "Receipt" },
  { id: "model", label: "Model it" },
  { id: "deck", label: "One at a time" },
  { id: "waterfall", label: "Waterfall" },
  { id: "compare", label: "Compare" },
  { id: "timeline", label: "When it lands" },
  { id: "needs", label: "By need" },
] as const;

type VariantId = (typeof VARIANTS)[number]["id"];

export function RecoveryVariants() {
  const [variant, setVariant] = useState<VariantId>("plan");
  const [chosen, setChosen] = useState<string[]>([
    "insurance",
    "ihp",
    "ona",
    "irs",
  ]);
  const [searching, setSearching] = useState(false);
  /* Tuned amounts live here rather than in the Plan variant, so a figure
     adjusted there is the figure every other view reports. */
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const amountOf = (p: Program) => amounts[p.id] ?? p.amount;
  const setAmount = (id: string, value: number) =>
    setAmounts((all) => ({ ...all, [id]: value }));

  const toggle = (id: string) =>
    setChosen((all) =>
      all.includes(id) ? all.filter((x) => x !== id) : [...all, id],
    );

  const selected = useMemo(
    () =>
      PROGRAMS.filter((p) => chosen.includes(p.id)).sort(
        (a, b) => a.order - b.order,
      ),
    [chosen],
  );

  const funded = selected.reduce((n, p) => n + amountOf(p), 0) + OWN_MONEY;
  const open = Math.max(DOCUMENTED_DAMAGE - funded, 0);

  const shared = {
    chosen,
    toggle,
    selected,
    funded,
    open,
    amountOf,
    setAmount,
  };

  return (
    <div className="rv">
      <header className="rv__top">
        <p className="rv__eyebrow">Recovery plan · {money(DOCUMENTED_DAMAGE)} documented</p>
        <div className="rv__tabs" role="tablist">
          {VARIANTS.map((v) => (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={variant === v.id}
              className={`rv__tab${variant === v.id ? " is-on" : ""}`}
              onClick={() => setVariant(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </header>

      <button
        type="button"
        className="rv__search"
        onClick={() => setSearching(true)}
      >
        <Search size={15} strokeWidth={2} aria-hidden="true" />
        Find another programme
      </button>

      {variant === "plan" && <PlanTune {...shared} />}
      {variant === "receipt" && <Receipt {...shared} />}
      {variant === "model" && <ModelIt {...shared} />}
      {variant === "deck" && <Deck {...shared} />}
      {variant === "waterfall" && <Waterfall {...shared} />}
      {variant === "compare" && <Compare {...shared} />}
      {variant === "timeline" && <Timeline {...shared} />}
      {variant === "needs" && <ByNeed {...shared} />}

      <AnimatePresence>
        {searching && (
          <ProgramSearch
            chosen={chosen}
            toggle={toggle}
            onClose={() => setSearching(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface Shared {
  chosen: string[];
  toggle: (id: string) => void;
  selected: Program[];
  funded: number;
  open: number;
  /** The tuned figure for a programme, or its default. */
  amountOf: (p: Program) => number;
  setAmount: (id: string, value: number) => void;
}

/* --- 1. Plan -----------------------------------------------------------------
 * The working view, and the default: summary pinned above, programmes below,
 * each opening to a slider that moves the bar as it moves.
 *
 * The other six read the amounts set here rather than keeping their own, so a
 * figure tuned once is the figure everywhere.
 * -------------------------------------------------------------------------- */

function PlanTune({
  chosen,
  toggle,
  selected,
  funded,
  open,
  amountOf,
  setAmount,
}: Shared) {
  const [openId, setOpenId] = useState<string | null>(null);
  const list = PROGRAMS.filter((p) => !p.blocked);

  return (
    <>
      <div className="rp__sticky">
        <div className="rp__cards">
          <div className="rp-card rp-card--covered">
            <p className="rp-card__k">Funded</p>
            <motion.p
              key={funded}
              className="rp-card__v"
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {money(Math.min(funded, DOCUMENTED_DAMAGE))}
            </motion.p>
            <p className="rp-card__n">
              {selected.length} programmes plus {money(OWN_MONEY)} of your own
            </p>
          </div>

          <div className="rp-card rp-card--gap">
            <p className="rp-card__k">Still open</p>
            <motion.p
              key={open}
              className="rp-card__v"
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {money(open)}
            </motion.p>
            <p className="rp-card__n">
              {open > 0 ? "No source yet" : "Covered on paper"}
            </p>
          </div>
        </div>

        <div className="rp-bar">
          <div className="rp-bar__head">
            <span>Funding</span>
            <span className="rp-bar__of">
              {money(DOCUMENTED_DAMAGE)} documented
            </span>
          </div>
          <div className="rp-bar__track">
            <motion.i
              className="rp-bar__seg rp-bar__seg--policy"
              animate={{ width: `${(OWN_MONEY / DOCUMENTED_DAMAGE) * 100}%` }}
              transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            />
            <motion.i
              className="rp-bar__seg rp-bar__seg--plan"
              animate={{
                width: `${
                  (Math.min(funded - OWN_MONEY, DOCUMENTED_DAMAGE) /
                    DOCUMENTED_DAMAGE) *
                  100
                }%`,
              }}
              transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            />
          </div>
          <ul className="rp-bar__key">
            <li>
              <span className="rp-bar__dot rp-bar__dot--policy" />
              Your money {money(OWN_MONEY)}
            </li>
            <li>
              <span className="rp-bar__dot rp-bar__dot--plan" />
              Programmes {money(Math.max(funded - OWN_MONEY, 0))}
            </li>
            <li>
              <span className="rp-bar__dot rp-bar__dot--open" />
              Open {money(open)}
            </li>
          </ul>
        </div>
      </div>

      <div className="rp__subhead">
        <h3 className="rp__sub">Programmes you can use</h3>
      </div>

      <div className="rp__options">
        {list.map((p) => {
          const on = chosen.includes(p.id);
          const isOpen = openId === p.id;
          const max = maxFor(p);

          return (
            <div className={`rp-opt${on ? " is-on" : ""}`} key={p.id}>
              <button
                type="button"
                className="rp-opt__head"
                aria-expanded={isOpen}
                onClick={() => setOpenId(isOpen ? null : p.id)}
              >
                <span className="rp-opt__body">
                  <span className="rp-opt__name">
                    {p.name}
                    <span className={`rv-tag is-${p.kind}`}>
                      {MONEY_LABEL[p.kind]}
                    </span>
                  </span>
                  <span className="rp-opt__sub">
                    {p.cap} · {p.speed}
                  </span>
                </span>
                <span className="rp-opt__amt">
                  {on && <em>{money(amountOf(p))}</em>}
                  <span className="rp-opt__icon" aria-hidden="true">
                    {on ? (
                      <Check size={15} strokeWidth={2.6} />
                    ) : (
                      <Plus size={15} strokeWidth={2.4} />
                    )}
                  </span>
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    className="rp-opt__more"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                  >
                    <div className="rp-opt__inner">
                      <p className="rv-detail">{p.detail}</p>

                      <p className="rv-k">Who's eligible</p>
                      <p className="rv-detail">{p.eligibility}</p>

                      <p className="rv-k">How you can use it</p>
                      <p className="rv-detail">{p.howToUse}</p>

                      {max > 0 && (
                        <label className="rv-ctl rv-ctl--inline">
                          <span>
                            Count on <b>{money(amountOf(p))}</b>
                          </span>
                          <input
                            type="range"
                            min={0}
                            max={max}
                            step={Math.max(Math.round(max / 40), 100)}
                            value={amountOf(p)}
                            onChange={(e) =>
                              setAmount(p.id, Number(e.target.value))
                            }
                          />
                          <em>
                            {p.kind === "grant"
                              ? "Typical awards sit well below the cap — the slider starts there."
                              : p.kind === "loan"
                                ? "Borrowed, and repaid with interest."
                                : "Adjust to what you expect to receive."}
                          </em>
                        </label>
                      )}

                      <div className="rp-opt__acts">
                        <button
                          type="button"
                          className="rp-opt__done"
                          onClick={() => toggle(p.id)}
                        >
                          {on ? "Remove from plan" : "Add to plan"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </>
  );
}

/** Upper bound for a programme's slider, read from its stated cap. */
function maxFor(p: Program): number {
  const digits = p.cap.replace(/[^0-9]/g, "");
  if (digits) return Number(digits);
  return p.amount > 0 ? Math.round(p.amount * 2) : 0;
}

/* --- 1. Receipt --------------------------------------------------------------
 * Everything in one column, adding up. The cheapest view to scan and the one
 * that makes an unfunded balance impossible to miss.
 * -------------------------------------------------------------------------- */

function Receipt({ selected, funded, open, toggle, chosen, amountOf }: Shared) {
  const unchosen = PROGRAMS.filter((p) => !chosen.includes(p.id) && !p.blocked);

  return (
    <section className="rv-receipt">
      <p className="rv-line rv-line--head">
        <span>Documented damage</span>
        <b>{money(DOCUMENTED_DAMAGE)}</b>
      </p>

      <p className="rv-line">
        <span>Your own money</span>
        <b>−{money(OWN_MONEY)}</b>
      </p>

      {selected.map((p) => (
        <button
          type="button"
          className="rv-line rv-line--item"
          key={p.id}
          onClick={() => toggle(p.id)}
        >
          <span>
            {p.name}
            <em>{MONEY_LABEL[p.kind]}</em>
          </span>
          <b>−{money(amountOf(p))}</b>
        </button>
      ))}

      <p className={`rv-line rv-line--total${open === 0 ? " is-closed" : ""}`}>
        <span>Still to fund</span>
        <b>{money(open)}</b>
      </p>

      <p className="rv-receipt__note">
        {open === 0
          ? "Covered on paper. Loans in this list are repaid, so check what the balance costs you over time."
          : `Funded ${Math.round((funded / DOCUMENTED_DAMAGE) * 100)}% of what you documented.`}
      </p>

      {unchosen.length > 0 && (
        <>
          <p className="rv-receipt__add">Add a line</p>
          <div className="rv-chips">
            {unchosen.map((p) => (
              <button key={p.id} type="button" onClick={() => toggle(p.id)}>
                <Plus size={12} strokeWidth={2.6} aria-hidden="true" />
                {p.name}
                <em>{money(p.amount)}</em>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

/* --- 2. Model it -------------------------------------------------------------
 * The only view where a loan is more than a number: term and rate produce a
 * monthly payment and a total cost, which is what the decision turns on.
 * -------------------------------------------------------------------------- */

function ModelIt({ chosen, toggle }: Shared) {
  const [sbaAmount, setSbaAmount] = useState(110_000);
  const [term, setTerm] = useState(30);
  const [rate, setRate] = useState(2.5);
  const [ihpSplit, setIhpSplit] = useState(70);

  const r = rate / 100 / 12;
  const n = term * 12;
  const monthly = sbaAmount > 0 ? (sbaAmount * r) / (1 - (1 + r) ** -n) : 0;
  const totalPaid = monthly * n;

  const ihp = PROGRAMS.find((p) => p.id === "ihp")!;
  const housing = Math.round((ihp.amount * ihpSplit) / 100);

  return (
    <section className="rv-model">
      <article className="rv-model__card">
        <header>
          <h3>SBA home disaster loan</h3>
          <p>Model it before you accept — the rate is capped, the term isn't.</p>
        </header>

        <label className="rv-ctl">
          <span>
            Amount <b>{money(sbaAmount)}</b>
          </span>
          <input
            type="range"
            min={0}
            max={500_000}
            step={10_000}
            value={sbaAmount}
            onChange={(e) => setSbaAmount(Number(e.target.value))}
          />
        </label>

        <label className="rv-ctl">
          <span>
            Term <b>{term} years</b>
          </span>
          <input
            type="range"
            min={5}
            max={30}
            step={5}
            value={term}
            onChange={(e) => setTerm(Number(e.target.value))}
          />
        </label>

        <div className="rv-ctl">
          <span>Rate</span>
          <div className="rv-chips rv-chips--tight">
            {[2.5, 3.3, 4.0].map((x) => (
              <button
                key={x}
                type="button"
                className={rate === x ? "is-on" : undefined}
                onClick={() => setRate(x)}
              >
                {x}%
                <em>
                  {x === 2.5
                    ? "No credit elsewhere"
                    : x === 3.3
                      ? "Standard"
                      : "Business rate"}
                </em>
              </button>
            ))}
          </div>
        </div>

        <div className="rv-model__out">
          <div>
            <span>Monthly</span>
            <b>${Math.round(monthly).toLocaleString()}</b>
          </div>
          <div>
            <span>Total repaid</span>
            <b>{money(Math.round(totalPaid))}</b>
          </div>
          <div className="is-cost">
            <span>Cost of borrowing</span>
            <b>{money(Math.round(totalPaid - sbaAmount))}</b>
          </div>
        </div>

        <p className="rv-model__note">
          A longer term lowers the monthly payment and raises what you repay in
          total. At {term} years this loan costs{" "}
          {money(Math.round(totalPaid - sbaAmount))} beyond what you borrow.
        </p>

        <button
          type="button"
          className={`rv-add${chosen.includes("sba-home") ? " is-on" : ""}`}
          onClick={() => toggle("sba-home")}
        >
          {chosen.includes("sba-home") ? "In your plan" : "Add to plan"}
        </button>
      </article>

      <article className="rv-model__card">
        <header>
          <h3>FEMA Housing Assistance</h3>
          <p>
            Decide what it's for before it arrives — FEMA can ask for it back if
            it's spent outside its purpose.
          </p>
        </header>

        <label className="rv-ctl">
          <span>
            Toward repairs <b>{ihpSplit}%</b>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={10}
            value={ihpSplit}
            onChange={(e) => setIhpSplit(Number(e.target.value))}
          />
        </label>

        <div className="rv-split">
          <div>
            <span>Repairs</span>
            <b>{money(housing)}</b>
          </div>
          <div>
            <span>Rent while displaced</span>
            <b>{money(ihp.amount - housing)}</b>
          </div>
        </div>

        <p className="rv-model__note">
          Both are eligible uses. Rental assistance is renewed on proof of need,
          so money put toward rent can extend rather than run out — but repairs
          are what get you home.
        </p>

        <button
          type="button"
          className={`rv-add${chosen.includes("ihp") ? " is-on" : ""}`}
          onClick={() => toggle("ihp")}
        >
          {chosen.includes("ihp") ? "In your plan" : "Add to plan"}
        </button>
      </article>
    </section>
  );
}

/* --- 3. Deck -----------------------------------------------------------------
 * One programme at a time, in full. Slower by design — for the first read
 * rather than the tenth.
 * -------------------------------------------------------------------------- */

function Deck({ chosen, toggle }: Shared) {
  const [i, setI] = useState(0);
  const list = PROGRAMS.filter((p) => !p.blocked);
  const p = list[i];

  return (
    <section className="rv-deck">
      <div className="rv-deck__nav">
        <button
          type="button"
          disabled={i === 0}
          onClick={() => setI((n) => n - 1)}
          aria-label="Previous programme"
        >
          <ArrowLeft size={16} strokeWidth={2.2} />
        </button>
        <span>
          {i + 1} of {list.length}
        </span>
        <button
          type="button"
          disabled={i === list.length - 1}
          onClick={() => setI((n) => n + 1)}
          aria-label="Next programme"
        >
          <ArrowRight size={16} strokeWidth={2.2} />
        </button>
      </div>

      <article className="rv-card">
        <p className="rv-card__kind">
          {MONEY_LABEL[p.kind]} · {p.agency}
        </p>
        <h3 className="rv-card__name">{p.name}</h3>

        <button type="button" className="rv-card__video">
          <span className="rv-card__thumb" aria-hidden="true">
            <Play size={16} strokeWidth={2.4} />
            <em>{p.video.length}</em>
          </span>
          <span>
            <b>Watch</b>
            {p.video.title}
          </span>
        </button>

        <div className="rv-card__facts">
          <div>
            <span>Typical for you</span>
            <b>{p.amount > 0 ? money(p.amount) : "—"}</b>
          </div>
          <div>
            <span>Range</span>
            <b>{p.cap}</b>
          </div>
          <div>
            <span>Money arrives</span>
            <b>{p.speed}</b>
          </div>
        </div>

        <p className="rv-card__k">What it is</p>
        <p className="rv-card__t">{p.detail}</p>

        <p className="rv-card__k">Who's eligible</p>
        <p className="rv-card__t">{p.eligibility}</p>

        <p className="rv-card__k">How you can use it</p>
        <p className="rv-card__t">{p.howToUse}</p>

        <p className="rv-card__k">Covers</p>
        <div className="rv-needs">
          {p.needs.map((nd) => (
            <span key={nd}>{NEED_LABEL[nd]}</span>
          ))}
        </div>

        <button
          type="button"
          className={`rv-add${chosen.includes(p.id) ? " is-on" : ""}`}
          onClick={() => toggle(p.id)}
        >
          {chosen.includes(p.id) ? "In your plan — remove" : "Add to plan"}
        </button>
      </article>
    </section>
  );
}

/* --- 4. Waterfall ------------------------------------------------------------
 * The order money arrives in, which is also the order the rules require. The
 * one view that makes duplication of benefits visible.
 * -------------------------------------------------------------------------- */

function Waterfall({ selected, open, amountOf }: Shared) {
  let running = OWN_MONEY;

  return (
    <section className="rv-fall">
      <p className="rv-fall__intro">
        Each programme measures what it owes you against what the ones above it
        already paid. That's why the order is fixed — and why filing out of
        order slows everything down.
      </p>

      <div className="rv-fall__step is-own">
        <span className="rv-fall__n">0</span>
        <div>
          <b>Your own money</b>
          <em>Available immediately</em>
        </div>
        <span className="rv-fall__amt">{money(OWN_MONEY)}</span>
      </div>

      {selected.map((p, n) => {
        running += amountOf(p);
        return (
          <div className="rv-fall__step" key={p.id}>
            <span className="rv-fall__n">{n + 1}</span>
            <div>
              <b>{p.name}</b>
              <em>
                {p.speed} · running total {money(running)}
              </em>
            </div>
            <span className="rv-fall__amt">{money(amountOf(p))}</span>
          </div>
        );
      })}

      <div className="rv-fall__step is-open">
        <span className="rv-fall__n">—</span>
        <div>
          <b>Still unfunded</b>
          <em>No source identified</em>
        </div>
        <span className="rv-fall__amt">{money(open)}</span>
      </div>
    </section>
  );
}

/* --- 5. Compare --------------------------------------------------------------
 * Grants only against grants plus loans. The gap closes in one column and the
 * cost appears in the other, which is the trade nobody states plainly.
 * -------------------------------------------------------------------------- */

function Compare({ chosen }: Shared) {
  const grants = PROGRAMS.filter(
    (p) => chosen.includes(p.id) && p.kind !== "loan",
  ).reduce((n, p) => n + p.amount, 0);
  const loans = PROGRAMS.filter(
    (p) => chosen.includes(p.id) && p.kind === "loan",
  ).reduce((n, p) => n + p.amount, 0);

  const withoutLoans = Math.max(DOCUMENTED_DAMAGE - grants - OWN_MONEY, 0);
  const withLoans = Math.max(withoutLoans - loans, 0);
  /* 30 years at 2.5%, the standard SBA home loan terms. */
  const cost = loans > 0 ? loans * 0.4218 : 0;

  return (
    <section className="rv-compare">
      <div className="rv-compare__col">
        <p className="rv-compare__k">Grants and cash only</p>
        <p className="rv-compare__v">{money(withoutLoans)}</p>
        <p className="rv-compare__n">still unfunded</p>
        <ul>
          <li>Nothing to repay</li>
          <li>You carry the shortfall yourself</li>
          <li>Rebuilding smaller may be the only route</li>
        </ul>
      </div>

      <div className="rv-compare__col is-alt">
        <p className="rv-compare__k">Adding the loans</p>
        <p className="rv-compare__v">{money(withLoans)}</p>
        <p className="rv-compare__n">still unfunded</p>
        <ul>
          <li>{money(loans)} borrowed</li>
          <li>About {money(Math.round(cost))} in interest over 30 years</li>
          <li>A monthly payment for the term</li>
        </ul>
      </div>

      <p className="rv-compare__note">
        The bar closes in the second column, and the obligation doesn't. Both
        are real answers — the second is a decision about the next thirty years,
        not about this month.
      </p>
    </section>
  );
}

/* --- 6. Timeline -------------------------------------------------------------
 * When money lands. A plan that is fully funded on paper can still leave
 * someone unable to pay a contractor in week three.
 * -------------------------------------------------------------------------- */

const BANDS: [string, string[]][] = [
  ["This week", ["Same week", "1–2 weeks"]],
  ["This month", ["1–3 weeks", "2–4 weeks", "2–4 weeks to decision", "Same month"]],
  ["1–2 months", ["2–8 weeks", "3–6 weeks", "3–6 weeks after inspection"]],
  ["Later", ["6–10 weeks if you amend", "12–18 months", "Unknown"]],
];

function Timeline({ selected, amountOf }: Shared) {
  return (
    <section className="rv-when">
      <p className="rv-when__intro">
        Fully funded on paper still leaves you unable to pay a contractor in
        week three. This is the same plan, ordered by when the money lands.
      </p>

      {BANDS.map(([band, speeds]) => {
        const inBand = selected.filter((p) => speeds.includes(p.speed));
        const total = inBand.reduce((n, p) => n + amountOf(p), 0);
        return (
          <div className="rv-when__band" key={band}>
            <div className="rv-when__head">
              <b>{band}</b>
              <span>{total > 0 ? money(total) : "nothing"}</span>
            </div>
            {inBand.length === 0 ? (
              <p className="rv-when__empty">
                No money arrives in this window.
              </p>
            ) : (
              inBand.map((p) => (
                <p className="rv-when__row" key={p.id}>
                  <span>{p.name}</span>
                  <b>{money(amountOf(p))}</b>
                </p>
              ))
            )}
          </div>
        );
      })}
    </section>
  );
}

/* --- 7. By need --------------------------------------------------------------
 * Allocated by what's broken. Shows the category nothing in the plan reaches,
 * which a programme-first list hides.
 * -------------------------------------------------------------------------- */

/* What each category costs, from the damage log. They sum to the documented
   total, so the four bars account for the whole loss. */
const NEED_COSTS: [Need, number][] = [
  ["housing", 176_000],
  ["contents", 52_000],
  ["vehicle", 8_400],
  ["living", 14_850],
];

function ByNeed({ selected, toggle, chosen, amountOf }: Shared) {
  return (
    <section className="rv-needs-view">
      {NEED_COSTS.map(([need, cost]) => {
        const covering = selected.filter(
          (p) => p.needs.includes(need) || p.needs.includes("any"),
        );
        const got = covering.reduce((n, p) => n + amountOf(p), 0);
        const pct = Math.min(Math.round((got / cost) * 100), 100);

        return (
          <div className="rv-need" key={need}>
            <div className="rv-need__head">
              <b>{NEED_LABEL[need]}</b>
              <span>
                {money(Math.min(got, cost))} of {money(cost)}
              </span>
            </div>
            <div className="rv-need__track">
              <i style={{ width: `${pct}%` }} />
            </div>
            {covering.length === 0 ? (
              <p className="rv-need__none">
                Nothing in your plan reaches this.
              </p>
            ) : (
              <p className="rv-need__who">
                {covering.map((p) => p.name).join(" · ")}
              </p>
            )}
          </div>
        );
      })}

      <p className="rv-needs-view__note">
        A programme-first list hides the category nothing covers. Vehicles are
        the usual one — only ONA and the SBA property loan reach them.
      </p>

      <div className="rv-chips">
        {PROGRAMS.filter((p) => !chosen.includes(p.id) && !p.blocked).map((p) => (
          <button key={p.id} type="button" onClick={() => toggle(p.id)}>
            <Plus size={12} strokeWidth={2.6} aria-hidden="true" />
            {p.name}
          </button>
        ))}
      </div>
    </section>
  );
}

/* --- Search ------------------------------------------------------------------
 * The catalogue is wider than the plan. County bridge loans, forbearance,
 * penalty-free withdrawals and utility relief are the ones households miss.
 * -------------------------------------------------------------------------- */

function ProgramSearch({
  chosen,
  toggle,
  onClose,
}: {
  chosen: string[];
  toggle: (id: string) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const results = searchPrograms(q);
  const host = document.getElementById("app-viewport");

  const panel = (
    <motion.div
      className="rv-search"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
    >
      <header className="rv-search__top">
        <h2>Find a programme</h2>
        <button type="button" onClick={onClose} aria-label="Close">
          <X size={19} strokeWidth={2} aria-hidden="true" />
        </button>
      </header>

      <div className="rv-search__field">
        <Search size={15} strokeWidth={2} aria-hidden="true" />
        <input
          autoFocus
          value={q}
          placeholder="Mortgage, vehicle, self-employed, county…"
          aria-label="Search programmes"
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="rv-search__list">
        {results.length === 0 && (
          <p className="rv-search__none">
            Nothing matches that. Programmes open through the recovery — we'll
            alert you when new ones activate for your address.
          </p>
        )}

        {results.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`rv-search__row${chosen.includes(p.id) ? " is-on" : ""}`}
            onClick={() => toggle(p.id)}
            disabled={Boolean(p.blocked)}
          >
            <span>
              <b>{p.name}</b>
              <em>
                {MONEY_LABEL[p.kind]} · {p.agency}
              </em>
              <i>{p.eligibility}</i>
            </span>
            <span className="rv-search__right">
              <b>{p.blocked ?? (p.amount > 0 ? money(p.amount) : "—")}</b>
              {!p.blocked && (
                <span className="rv-search__tick">
                  {chosen.includes(p.id) ? (
                    <Check size={13} strokeWidth={3} />
                  ) : (
                    <Plus size={13} strokeWidth={2.6} />
                  )}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  );

  return host ? createPortal(panel, host) : panel;
}
