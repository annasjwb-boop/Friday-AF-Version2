import { useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Search, X } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import type { SupportCategory } from "../../types";
import {
  disasterOptions,
  displacementMonthlyCost,
  formatMoney,
  formatMoneyCompact,
  supportCategoryMeta,
  supportOptions,
} from "../../data/recovery";
import {
  contributionImpact,
  personalFinances,
  POLICY,
  rebuildEstimate,
  reservesTotal,
  type RecoveryPlan,
  type RecoveryTuning,
} from "./recoveryPlan";
import "./CasitaRecovery.css";

/* ---------------------------------------------------------------------------
 * Tap-through detail sheets for the recovery funding cards:
 *  - Insurance: the policy in plain language, applied to this scenario.
 *  - Your Money: set which reserves you'd draw from, and how much.
 *  - Outside Funding: explore programs, requirements, and include them.
 * Shares the full-screen takeover shell with the scenario tuner.
 * ------------------------------------------------------------------------- */

function RecoverySheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const host = document.getElementById("app-viewport");

  const panel = (
    <motion.div
      className="rec-tune"
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 28 }}
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
    >
      <header className="rec-tune__head">
        <button
          type="button"
          className="rec-tune__close"
          aria-label="Close"
          onClick={onClose}
        >
          <X size={17} strokeWidth={2.2} />
        </button>
        <span className="rec-tune__heading">{title}</span>
        <span className="rec-tune__head-spacer" aria-hidden="true" />
      </header>

      <div className="rec-tune__scroll">{children}</div>

      <footer className="rec-tune__foot">
        <button type="button" className="rec-tune__done" onClick={onClose}>
          Done
        </button>
      </footer>
    </motion.div>
  );

  return host ? createPortal(panel, host) : panel;
}

/* --- Insurance: the policy in plain language --------------------------------- */

const COVERAGE_LABELS: Record<string, string> = {
  rebuild: "Rebuilding the structure",
  property: "Replacing belongings",
  displacement: "Living elsewhere",
};

/** How to close the hole when the chosen peril isn't covered. */
const UNCOVERED_FIX: Record<string, string> = {
  flood:
    "A separate NFIP flood policy — about $20/month here — is how homeowners close that hole.",
  earthquake:
    "A separate earthquake endorsement on top of this policy is how homeowners close that hole.",
};

/**
 * Explains why insurance pays what it pays for one cost in this scenario —
 * naming the specific mechanism (share, deductible, cap) behind any gap.
 */
function scenarioRowText(
  id: string,
  col: { total: number; insurance: number },
  covered: boolean,
): string {
  if (!covered)
    return "Nothing — this peril isn't on the policy, so the cost falls entirely outside it.";
  if (col.total === 0) return "No cost in this scenario.";
  const short = col.total - col.insurance;
  if (short <= 0) return "Fully covered in this scenario.";

  if (id === "rebuild") {
    return col.insurance >= POLICY.dwellingLimit
      ? `Pays its full ${formatMoneyCompact(POLICY.dwellingLimit)} ceiling, but this rebuild costs ${formatMoneyCompact(col.total)}. The ${formatMoneyCompact(short)} above the limit is yours — the policy doesn't stretch.`
      : `Covers ${Math.round(POLICY.dwellingShare * 100)}% after your ${formatMoney(POLICY.deductible)} deductible. The other ${formatMoneyCompact(short)} — your share plus the deductible — comes from you.`;
  }
  if (id === "property") {
    return `You'd lose ${formatMoneyCompact(col.total)} in belongings, but the policy stops at ${formatMoneyCompact(POLICY.contentsLimit)}. The ${formatMoneyCompact(short)} past the cap isn't covered.`;
  }
  const paidMonths = Math.floor(col.insurance / displacementMonthlyCost);
  return `Covers about ${paidMonths} months of temporary housing before the ${formatMoneyCompact(POLICY.lossOfUseLimit)} cap runs out. The remaining ${formatMoneyCompact(short)} of rent is on you.`;
}

export function RecoveryInsuranceSheet({
  plan,
  tuning,
  onClose,
}: {
  plan: RecoveryPlan;
  tuning: RecoveryTuning;
  onClose: () => void;
}) {
  const [view, setView] = useState<"scenario" | "policy">("scenario");
  const disaster = disasterOptions.find((d) => d.id === tuning.disasterType);
  const insuranceShort = plan.total - plan.insurance;
  const maxPayout =
    POLICY.dwellingLimit + POLICY.contentsLimit + POLICY.lossOfUseLimit;
  const lossOfUseMonths = Math.floor(
    POLICY.lossOfUseLimit / displacementMonthlyCost,
  );

  /* Worked example: a partial kitchen fire, small enough to feel relatable. */
  const exampleDamage = 60000;
  const examplePayout = Math.round(
    (exampleDamage - POLICY.deductible) * POLICY.dwellingShare,
  );

  const generalRows = [
    {
      id: "rebuild",
      limit: POLICY.dwellingLimit,
      text: `Repairs or rebuilds the structure — pays ${Math.round(POLICY.dwellingShare * 100)}% of the damage after your ${formatMoney(POLICY.deductible)} deductible, never more than ${formatMoneyCompact(POLICY.dwellingLimit)} total. Example: a ${formatMoneyCompact(exampleDamage)} kitchen fire → you pay the first ${formatMoney(POLICY.deductible)}, the policy pays about ${formatMoneyCompact(examplePayout)}.`,
    },
    {
      id: "property",
      limit: POLICY.contentsLimit,
      text: `Everything inside — furniture, electronics, clothing — combined. Replacing a fully furnished home usually runs ${formatMoneyCompact(90000)}+, so a total loss clears this cap with room to spare.`,
    },
    {
      id: "displacement",
      limit: POLICY.lossOfUseLimit,
      text: `Rent, hotel, and extra living costs while you can't be home. At about ${formatMoneyCompact(displacementMonthlyCost)}/month here, it lasts roughly ${lossOfUseMonths} months — long rebuilds outlast it.`,
    },
  ];

  return (
    <RecoverySheet title="Your policy, plainly" onClose={onClose}>
      <div className="rec-tune__chips rec-sheet__tabs" role="tablist">
        <button
          type="button"
          className={`rec-chip${view === "scenario" ? " is-selected" : ""}`}
          aria-pressed={view === "scenario"}
          onClick={() => setView("scenario")}
        >
          This scenario
        </button>
        <button
          type="button"
          className={`rec-chip${view === "policy" ? " is-selected" : ""}`}
          aria-pressed={view === "policy"}
          onClick={() => setView("policy")}
        >
          In general
        </button>
      </div>

      {view === "scenario" ? (
        <>
          <div className="rec-sheet__hero">
            <span className="rec-sheet__hero-label">
              Pays in this scenario
            </span>
            <span className="rec-sheet__hero-value">
              {formatMoneyCompact(plan.insurance)}
            </span>
            <span className="rec-sheet__hero-note">
              of the {formatMoneyCompact(plan.total)} this{" "}
              {disaster?.label.toLowerCase() ?? "disaster"} would cost
            </span>
          </div>

          {!plan.covered && (
            <p className="rec-sheet__warn">
              {disaster?.label ?? "This peril"} isn't covered by this policy,
              so it pays nothing in this scenario.{" "}
              {UNCOVERED_FIX[tuning.disasterType] ??
                "A separate policy is how homeowners close that hole."}
            </p>
          )}

          <section className="rec-tune__group" aria-label="What it pays here">
            <h2 className="rec-tune__group-title">
              Where the money goes — and stops
            </h2>
            <div className="rec-sheet__rows">
              {plan.columns.map((col) => (
                <div key={col.id} className="rec-sheet__row">
                  <div className="rec-sheet__row-head">
                    <span className="rec-sheet__row-label">
                      {COVERAGE_LABELS[col.id]}
                    </span>
                    <span className="rec-sheet__row-value">
                      {formatMoneyCompact(col.insurance)}
                      <span className="rec-sheet__row-of">
                        {" "}
                        of {formatMoneyCompact(col.total)}
                      </span>
                    </span>
                  </div>
                  <p className="rec-sheet__row-text">
                    {scenarioRowText(col.id, col, plan.covered)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {insuranceShort > 0 && (
            <p className="rec-tune__group-note">
              All in, insurance leaves {formatMoneyCompact(insuranceShort)} of
              this scenario unpaid. That's what Your Money and Outside Funding
              are working against.
            </p>
          )}
        </>
      ) : (
        <>
          <div className="rec-sheet__hero">
            <span className="rec-sheet__hero-label">
              The most it could ever pay
            </span>
            <span className="rec-sheet__hero-value">
              {formatMoneyCompact(maxPayout)}
            </span>
            <span className="rec-sheet__hero-note">
              {POLICY.carrier} · {POLICY.number} · All three limits combined
            </span>
          </div>

          <p className="rec-sheet__type">
            <i style={{ background: "#17181a" }} aria-hidden="true" />
            Every number in a policy is a ceiling, not a promise. "Up to
            {" "}{formatMoneyCompact(POLICY.dwellingLimit)}" means the insurer
            pays your documented losses, minus the deductible — and stops at
            the limit even if your real costs keep going.
          </p>

          <section className="rec-tune__group" aria-label="The three limits">
            <h2 className="rec-tune__group-title">
              Three buckets, three ceilings
            </h2>
            <div className="rec-sheet__rows">
              {generalRows.map((row) => (
                <div key={row.id} className="rec-sheet__row">
                  <div className="rec-sheet__row-head">
                    <span className="rec-sheet__row-label">
                      {COVERAGE_LABELS[row.id]}
                    </span>
                    <span className="rec-sheet__row-value">
                      up to {formatMoneyCompact(row.limit)}
                    </span>
                  </div>
                  <p className="rec-sheet__row-text">{row.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rec-tune__group" aria-label="Covered perils">
            <h2 className="rec-tune__group-title">What counts as covered</h2>
            <div className="rec-sheet__perils">
              {disasterOptions.map((option) => (
                <div key={option.id} className="rec-sheet__peril">
                  <span className="rec-sheet__peril-label">
                    {option.label}
                  </span>
                  <span
                    className={`rec-peril__badge${
                      option.covered ? "" : " rec-peril__badge--warn"
                    }`}
                  >
                    {option.covered ? "Covered" : "Not covered"}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rec-tune__group" aria-label="The fine print">
            <h2 className="rec-tune__group-title">
              The fine print, translated
            </h2>
            <ul className="rec-sheet__notes">
              <li>
                The first {formatMoney(POLICY.deductible)} of any claim is
                yours — that's the deductible.
              </li>
              <li>
                {rebuildEstimate(tuning) > POLICY.dwellingLimit
                  ? `Your dwelling limit is ${formatMoneyCompact(POLICY.dwellingLimit)}, but your rebuild estimate is ${formatMoneyCompact(rebuildEstimate(tuning))}. A total loss outruns the policy — that difference is yours.`
                  : rebuildEstimate(tuning) > POLICY.dwellingLimit * 0.95
                    ? `Your rebuild estimate sits right at the ${formatMoneyCompact(POLICY.dwellingLimit)} dwelling limit. Rebuild costs spike after big disasters — zero margin means any overrun is yours.`
                    : `Your ${formatMoneyCompact(rebuildEstimate(tuning))} rebuild estimate fits under the ${formatMoneyCompact(POLICY.dwellingLimit)} dwelling limit — but rebuild costs spike after big disasters, so a thin margin can vanish.`}
              </li>
              <li>
                Flood and earthquake are excluded. Each needs its own policy
                (NFIP flood runs about $20/month here).
              </li>
            </ul>
          </section>
        </>
      )}
    </RecoverySheet>
  );
}

/* --- Your Money: set draws per reserve ---------------------------------------- */

export function RecoveryMoneySheet({
  tuning,
  onChange,
  onClose,
}: {
  tuning: RecoveryTuning;
  onChange: (tuning: RecoveryTuning) => void;
  onClose: () => void;
}) {
  const sliderStyle = (fill: number) =>
    ({ "--fill": `${fill * 100}%` }) as CSSProperties;

  const apply = (
    reserveBalances: Record<string, number>,
    reserveDraws: Record<string, number>,
  ) => {
    const personalContribution = personalFinances.reserves.reduce(
      (sum, r) => sum + (reserveDraws[r.id] ?? 0),
      0,
    );
    onChange({ ...tuning, reserveBalances, reserveDraws, personalContribution });
  };

  const setDraw = (id: string, value: number) =>
    apply(tuning.reserveBalances, { ...tuning.reserveDraws, [id]: value });

  const setBalance = (id: string, value: number) =>
    apply(
      { ...tuning.reserveBalances, [id]: value },
      {
        ...tuning.reserveDraws,
        // Can't plan to use more than the bucket holds.
        [id]: Math.min(tuning.reserveDraws[id] ?? 0, value),
      },
    );

  return (
    <RecoverySheet title="Your money" onClose={onClose}>
      <div className="rec-sheet__hero">
        <span className="rec-sheet__hero-label">You'd put in</span>
        <span className="rec-sheet__hero-value">
          {formatMoney(tuning.personalContribution)}
        </span>
        <span className="rec-sheet__hero-note">
          {contributionImpact(
            tuning.personalContribution,
            reservesTotal(tuning),
          )}
        </span>
      </div>

      <p className="rec-tune__group-note">
        Tell us what's in each bucket, then decide how much of it you'd
        actually use — some dollars cost more to touch than others.
      </p>

      {personalFinances.reserves.map((reserve) => {
        const balance = tuning.reserveBalances[reserve.id] ?? 0;
        const draw = tuning.reserveDraws[reserve.id] ?? 0;
        return (
          <section
            key={reserve.id}
            className="rec-tune__group"
            aria-label={reserve.label}
          >
            <div className="rec-tune__slider-head">
              <h2 className="rec-tune__group-title">{reserve.label}</h2>
              <span className="rec-tune__slider-value">
                {formatMoney(draw)}
              </span>
            </div>
            <div className="rec-sheet__balance">
              <label
                className="rec-sheet__balance-label"
                htmlFor={`balance-${reserve.id}`}
              >
                What's in it
              </label>
              <input
                id={`balance-${reserve.id}`}
                className="rec-sheet__balance-input"
                type="text"
                inputMode="numeric"
                value={balance > 0 ? `$${balance.toLocaleString("en-US")}` : ""}
                placeholder="$0"
                onChange={(e) => {
                  const digits = e.target.value.replace(/[^0-9]/g, "");
                  setBalance(reserve.id, digits ? Number(digits) : 0);
                }}
              />
            </div>
            <input
              type="range"
              className="rec-tune__slider"
              min={0}
              max={Math.max(balance, 1)}
              step={100}
              value={draw}
              disabled={balance === 0}
              style={sliderStyle(balance > 0 ? draw / balance : 0)}
              aria-label={`Dollars from ${reserve.label}`}
              onChange={(e) => setDraw(reserve.id, Number(e.target.value))}
            />
            <div className="rec-tune__slider-scale">
              <span>Keep it</span>
              <span>Use it all</span>
            </div>
          </section>
        );
      })}
    </RecoverySheet>
  );
}

/* --- Outside Funding: explore programs ---------------------------------------- */

export function RecoveryAidSheet({
  tuning,
  onChange,
  onClose,
}: {
  tuning: RecoveryTuning;
  onChange: (tuning: RecoveryTuning) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SupportCategory | "all">("all");

  const toggle = (id: string) =>
    onChange({
      ...tuning,
      supportIds: tuning.supportIds.includes(id)
        ? tuning.supportIds.filter((x) => x !== id)
        : [...tuning.supportIds, id],
    });

  // Only offer tabs for types that actually have programs.
  const categories = [...new Set(supportOptions.map((o) => o.category))];

  const q = query.trim().toLowerCase();
  const visible = supportOptions.filter((option) => {
    if (category !== "all" && option.category !== category) return false;
    if (!q) return true;
    return [
      option.name,
      option.helpsWith,
      option.details,
      option.amountLabel,
      supportCategoryMeta[option.category].label,
    ]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  return (
    <RecoverySheet title="Outside funding" onClose={onClose}>
      <div className="rec-sheet__search">
        <Search size={15} strokeWidth={2.1} aria-hidden="true" />
        <input
          type="search"
          value={query}
          placeholder="Search programs"
          aria-label="Search programs"
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="rec-tune__chips rec-sheet__tabs" role="tablist">
        <button
          type="button"
          className={`rec-chip${category === "all" ? " is-selected" : ""}`}
          aria-pressed={category === "all"}
          onClick={() => setCategory("all")}
        >
          All
        </button>
        {categories.map((id) => (
          <button
            key={id}
            type="button"
            className={`rec-chip${category === id ? " is-selected" : ""}`}
            aria-pressed={category === id}
            onClick={() => setCategory(id)}
          >
            {supportCategoryMeta[id].label}
          </button>
        ))}
      </div>

      {category === "all" ? (
        <p className="rec-tune__group-note">
          Federal programs that could close part of the gap. Estimates only —
          awards depend on a disaster declaration and verified losses.
        </p>
      ) : (
        <p className="rec-sheet__type">
          <i
            style={{ background: supportCategoryMeta[category].color }}
            aria-hidden="true"
          />
          {supportCategoryMeta[category].description}
        </p>
      )}

      {visible.length === 0 && (
        <p className="rec-sheet__empty">
          No programs match &ldquo;{query}&rdquo;.
        </p>
      )}

      {visible.map((option) => {
        const on = tuning.supportIds.includes(option.id);
        const category = supportCategoryMeta[option.category];
        return (
          <article key={option.id} className="rec-sheet__program">
            <div className="rec-sheet__program-head">
              <div className="rec-sheet__program-title">
                <span
                  className="rec-sheet__program-dot"
                  style={{ background: category.color }}
                  aria-hidden="true"
                />
                <h2 className="rec-sheet__program-name">{option.name}</h2>
              </div>
              <button
                type="button"
                className={`rec-aid__switch${on ? " is-on" : ""}`}
                role="switch"
                aria-checked={on}
                aria-label={`Include ${option.name} in the plan`}
                onClick={() => toggle(option.id)}
              >
                <i />
              </button>
            </div>
            <p className="rec-sheet__program-amount">{option.amountLabel}</p>
            <p className="rec-sheet__program-text">{option.details}</p>
            <div className="rec-sheet__program-meta">
              <span>{option.metaLabel}</span>
              <span>{option.timing}</span>
            </div>
          </article>
        );
      })}
    </RecoverySheet>
  );
}
