import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Check,
  ChevronDown,
  ChevronRight,
  Gauge,
  ShieldCheck,
} from "lucide-react";
import type {
  AssetCategory,
  AssetItem,
  CostView,
  CostViewId,
  ReadinessSection,
} from "../../types";
import type { DetailsOrigin } from "./RiskScoreDetails";
import { RiskScoreHeroFlipped } from "./RiskScoreHeroFlipped";
import { AssetLibrarySheet } from "./AssetLibrarySheet";
import {
  assetLibrary,
  assetLibraryTotals,
  costViews,
  exposures,
  readinessSections,
} from "../../data/finance";
import { contentsValue, formatMoney } from "../../data/recovery";
import { riskScore } from "../../data/home";
import "./LedgerOverview.css";

export type LedgerTabId = "risk" | "preparedness" | "recovery";

const TABS: { id: LedgerTabId; label: string; icon: typeof Gauge }[] = [
  { id: "risk", label: "Risk score", icon: Gauge },
  { id: "preparedness", label: "Preparedness", icon: ShieldCheck },
  { id: "recovery", label: "Recovery", icon: BarChart3 },
];

type LedgerOverviewProps = {
  onOpenRisk: (origin: DetailsOrigin | null) => void;
  /** Controlled view (both or neither), so a parent can route to a view. */
  tab?: LedgerTabId;
  onTabChange?: (tab: LedgerTabId) => void;
};

function sectionPct(section: ReadinessSection): number {
  const done = section.items.filter((item) => item.done).length;
  return Math.round((done / section.items.length) * 100);
}

/**
 * Variant 5 — "Recovery Ledger". Per the reference: a dark instrument sheet
 * owns the top of the screen — solo icon tabs and the active view's hero —
 * then hands off to the light paper field below, where the breakdowns live
 * as quiet mono rows and soft cards. Three views: risk score (dusk ring +
 * exposures), preparedness (aid readiness + asset library), and recovery
 * (the financial outlook).
 */
export function LedgerOverview({
  onOpenRisk,
  tab: controlledTab,
  onTabChange,
}: LedgerOverviewProps) {
  const [internalTab, setInternalTab] = useState<LedgerTabId>("risk");
  const tab = controlledTab ?? internalTab;
  const setTab = onTabChange ?? setInternalTab;
  const [viewId, setViewId] = useState<CostViewId>("total");
  const [assetsOpen, setAssetsOpen] = useState(false);
  // Lifted so items added in the drill-in survive closing the sheet and
  // feed both the preparedness math and the library card.
  const [categories, setCategories] = useState<AssetCategory[]>(assetLibrary);

  const navigate = useNavigate();

  const documented = assetLibraryTotals(categories);
  const documentedPct = Math.min(
    Math.round((documented.value / contentsValue) * 100),
    100,
  );

  const addAssetItem = (categoryId: string, item: AssetItem) => {
    setCategories((current) =>
      current.map((category) =>
        category.id === categoryId
          ? { ...category, items: [...category.items, item] }
          : category,
      ),
    );
  };

  // Six sections make the complete picture; the asset library's share is
  // live (documented value vs. the contents estimate), the rest come from
  // their document checklists.
  const staticPcts = readinessSections.map(sectionPct);
  const readinessPcts = [
    ...staticPcts.slice(0, 3),
    documentedPct,
    ...staticPcts.slice(3),
  ];
  const readinessOverall = Math.round(
    readinessPcts.reduce((sum, pct) => sum + pct, 0) / readinessPcts.length,
  );

  const view = costViews.find((v) => v.id === viewId) ?? costViews[0];
  const covered = view.sources.reduce((sum, s) => sum + s.amount, 0);
  const uncovered = Math.max(view.total - covered, 0);

  return (
    <div className="ledger">
      <div className={`ledger-top ledger-top--${tab}`}>
        <div className="ledger-tabs" role="tablist" aria-label="Home views">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={id === tab}
              aria-label={label}
              title={label}
              className={`ledger-tabs__tab${id === tab ? " is-active" : ""}`}
              onClick={() => setTab(id)}
            >
              <Icon size={17} strokeWidth={1.5} aria-hidden="true" />
              <span className="ledger-tabs__indicator" aria-hidden="true" />
            </button>
          ))}
        </div>

        {tab === "risk" && <RiskScoreHeroFlipped score={riskScore} />}
        {tab === "preparedness" && (
          <PrepHero overall={readinessOverall} pcts={readinessPcts} />
        )}
        {tab === "recovery" && (
          <RecoveryHero
            view={view}
            covered={covered}
            uncovered={uncovered}
            onSelectView={setViewId}
          />
        )}
      </div>

      {/* Keyed so each view's content re-runs its entrance. */}
      <div className="ledger-body" key={tab}>
        {tab === "risk" && <RiskBody onOpenRisk={onOpenRisk} />}
        {tab === "preparedness" && (
          <PrepBody
            documentedValue={documented.value}
            documentedItems={documented.items}
            documentedPct={documentedPct}
            onOpenAssets={() => setAssetsOpen(true)}
          />
        )}
        {tab === "recovery" && (
          <RecoveryBody
            view={view}
            uncovered={uncovered}
            onExploreSupport={() => navigate("/recovery/support")}
          />
        )}
      </div>

      <AssetLibrarySheet
        open={assetsOpen}
        categories={categories}
        estimate={contentsValue}
        onAddItem={addAssetItem}
        onClose={() => setAssetsOpen(false)}
      />
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Risk score: exposure breakdown under the dusk ring hero.
 * ------------------------------------------------------------------------- */

function RiskBody({
  onOpenRisk,
}: {
  onOpenRisk: (origin: DetailsOrigin | null) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <>
      <section aria-label="Exposure breakdown">
        <p className="ledger-section-label">Exposure breakdown</p>
        <ul className="ledger-rows">
          {exposures.map((exposure) => {
            const expanded = expandedId === exposure.id;
            return (
              <li key={exposure.id} className="ledger-row">
                <button
                  type="button"
                  className="ledger-row__head"
                  aria-expanded={expanded}
                  onClick={() => setExpandedId(expanded ? null : exposure.id)}
                >
                  <span className="ledger-row__labels">
                    <span className="ledger-row__name">
                      {exposure.name}
                      <span className="ledger-row__inline">
                        · +{exposure.points} pts
                      </span>
                    </span>
                    <span className="ledger-row__meta">{exposure.meta}</span>
                  </span>
                  <ChevronDown
                    className={`ledger-row__chevron${expanded ? " is-open" : ""}`}
                    size={15}
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </button>
                {expanded && (
                  <div className="ledger-row__body">
                    <p className="ledger-row__description">
                      {exposure.description}
                    </p>
                    <p className="ledger-row__detail">{exposure.detail}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <button
        type="button"
        className="ledger-action"
        onClick={(event) => onOpenRisk({ x: event.clientX, y: event.clientY })}
      >
        View recommended actions
      </button>

      <p className="ledger-footnote">
        <span>
          Scored {riskScore.date} · {exposures.length} exposures
        </span>
        <ChevronDown size={12} strokeWidth={1.75} aria-hidden="true" />
      </p>
    </>
  );
}

/* ---------------------------------------------------------------------------
 * Preparedness: % readiness to apply for aid, section-by-section, plus the
 * asset library where belongings and estimated values are documented.
 * ------------------------------------------------------------------------- */

function PrepHero({ overall, pcts }: { overall: number; pcts: number[] }) {
  return (
    <section className="prep-hero" aria-label="Aid application readiness">
      <p className="prep-hero__label">Ready to apply for aid</p>
      <p className="prep-hero__figure">
        {overall}
        <span className="prep-hero__unit">%</span>
      </p>
      <div className="prep-hero__segments" aria-hidden="true">
        {pcts.map((pct, index) => (
          <span key={index} className="prep-hero__segment">
            <span
              className="prep-hero__segment-fill"
              style={{ width: `${pct}%` }}
            />
          </span>
        ))}
      </div>
      <p className="prep-hero__caption">
        Identity, property, insurance, belongings, home access, and vehicles —
        one complete picture that pre-fills every claim and aid application.
      </p>
    </section>
  );
}

function PrepBody({
  documentedValue,
  documentedItems,
  documentedPct,
  onOpenAssets,
}: {
  documentedValue: number;
  documentedItems: number;
  documentedPct: number;
  onOpenAssets: () => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const documentsDone = readinessSections.reduce(
    (sum, section) => sum + section.items.filter((item) => item.done).length,
    0,
  );
  const documentsTotal = readinessSections.reduce(
    (sum, section) => sum + section.items.length,
    0,
  );

  const renderSectionRow = (section: ReadinessSection) => {
    const expanded = expandedId === section.id;
    const pct = sectionPct(section);
    return (
      <li key={section.id} className="ledger-row">
        <button
          type="button"
          className="ledger-row__head"
          aria-expanded={expanded}
          onClick={() => setExpandedId(expanded ? null : section.id)}
        >
          <span className="ledger-row__labels">
            <span className="ledger-row__name">
              {section.name}
              <span
                className={`ledger-row__inline${pct === 100 ? " is-complete" : ""}${pct === 0 ? " is-empty" : ""}`}
              >
                · {pct}%
              </span>
            </span>
            <span className="ledger-row__meta">{section.meta}</span>
          </span>
          <ChevronDown
            className={`ledger-row__chevron${expanded ? " is-open" : ""}`}
            size={15}
            strokeWidth={1.75}
            aria-hidden="true"
          />
        </button>
        {expanded && (
          <ul className="ledger-row__items">
            {section.items.map((item) => (
              <li
                key={item.id}
                className={`ledger-row__item${item.done ? " is-done" : ""}`}
              >
                <span className="ledger-row__item-mark" aria-hidden="true">
                  {item.done && <Check size={11} strokeWidth={2.25} />}
                </span>
                {item.name}
                {!item.done && (
                  <span className="ledger-row__item-hint">Missing</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <>
      <section aria-label="Readiness by section">
        <p className="ledger-section-label">Readiness by section</p>
        <ul className="ledger-rows">
          {readinessSections.slice(0, 3).map(renderSectionRow)}

          {/* The asset library row drills into the library itself. */}
          <li className="ledger-row">
            <button
              type="button"
              className="ledger-row__head"
              onClick={onOpenAssets}
            >
              <span className="ledger-row__labels">
                <span className="ledger-row__name">
                  Asset library
                  <span
                    className={`ledger-row__inline${documentedPct === 100 ? " is-complete" : ""}`}
                  >
                    · {documentedPct}%
                  </span>
                </span>
                <span className="ledger-row__meta">
                  {documentedItems} belongings documented
                </span>
              </span>
              <ChevronRight
                className="ledger-row__chevron"
                size={15}
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </button>
          </li>

          {readinessSections.slice(3).map(renderSectionRow)}
        </ul>
      </section>

      <section aria-label="Asset library">
        <p className="ledger-section-label">Asset library</p>
        <button type="button" className="ledger-card" onClick={onOpenAssets}>
          <div className="ledger-card__row">
            <div className="ledger-card__labels">
              <span className="ledger-card__title">Documented value</span>
              <span className="ledger-card__subtitle">
                Personal belongings
              </span>
            </div>
            <div className="ledger-card__value-group">
              <span className="ledger-card__value">
                {formatMoney(documentedValue)}
              </span>
              <ChevronRight
                className="ledger-card__chevron"
                size={17}
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </div>
          </div>
          <div className="ledger-card__progress" aria-hidden="true">
            <span
              className="ledger-card__progress-fill"
              style={{ width: `${documentedPct}%` }}
            />
          </div>
          <p className="ledger-card__caption">
            Upload and document belongings with estimated values once — they
            pre-fill insurance claims and aid applications after a disaster.
          </p>
          <span className="ledger-card__meta">
            {documentedItems} items · {documentedPct}% of{" "}
            {formatMoney(contentsValue)} estimate
          </span>
        </button>
      </section>

      <p className="ledger-footnote">
        <span>
          {documentsDone} of {documentsTotal} documents on file ·{" "}
          {documentedItems} assets
        </span>
        <ChevronDown size={12} strokeWidth={1.75} aria-hidden="true" />
      </p>
    </>
  );
}

/* ---------------------------------------------------------------------------
 * Recovery roadmap: the financial outlook — what recovery costs, what's
 * covered and by whom, and the uncovered balance.
 * ------------------------------------------------------------------------- */

/** Bars in the funding strip; each is colored by the source it falls into. */
const BAR_COUNT = 64;
const GAP_COLOR = "rgb(255, 92, 74)";

function RecoveryHero({
  view,
  covered,
  uncovered,
  onSelectView,
}: {
  view: CostView;
  covered: number;
  uncovered: number;
  onSelectView: (id: CostViewId) => void;
}) {
  /* Each bar takes the color of the funding segment its midpoint falls in;
     bars past the covered amount read as the uncovered balance in red. */
  const barColor = (index: number): string => {
    const mid = ((index + 0.5) / BAR_COUNT) * view.total;
    let cumulative = 0;
    for (const source of view.sources) {
      cumulative += source.amount;
      if (mid <= cumulative) return source.color;
    }
    return GAP_COLOR;
  };

  return (
    <div className="recovery-hero">
      <div className="recovery-hero__views" role="tablist" aria-label="Cost view">
        {costViews.map((option) => (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={option.id === view.id}
            className={`recovery-hero__view${option.id === view.id ? " is-active" : ""}`}
            onClick={() => onSelectView(option.id)}
          >
            {option.tab}
          </button>
        ))}
      </div>

      {/* Keyed so the figure and bars re-run their entrance per view. */}
      <div className="recovery-hero__reading" key={view.id}>
        <p className="recovery-hero__label">{view.heading}</p>
        <p className="recovery-hero__figure">
          {formatMoney(view.total)}
          <sup className="recovery-hero__est">est</sup>
        </p>

        <div className="recovery-hero__bars" aria-hidden="true">
          {Array.from({ length: BAR_COUNT }, (_, i) => {
            const t = i / (BAR_COUNT - 1);
            return (
              <span
                key={i}
                className="recovery-hero__bar"
                style={{
                  height: `${8 + 56 * Math.pow(t, 1.7)}px`,
                  background: barColor(i),
                  opacity: 0.35 + 0.65 * t,
                  animationDelay: `${i * 6}ms`,
                }}
              />
            );
          })}
        </div>

        <div className="recovery-hero__axis">
          <span className="recovery-hero__axis-item">
            Covered {formatMoney(covered)}
          </span>
          <span className="recovery-hero__axis-item recovery-hero__axis-item--gap">
            Uncovered {formatMoney(uncovered)}
          </span>
        </div>
      </div>
    </div>
  );
}

function RecoveryBody({
  view,
  uncovered,
  onExploreSupport,
}: {
  view: CostView;
  uncovered: number;
  onExploreSupport: () => void;
}) {
  return (
    <>
      <section aria-label="Funding sources">
        <p className="ledger-section-label">Where funding comes from</p>
        <ul className="ledger-sources">
          {view.sources.map((source) => (
            <li key={source.id} className="ledger-source">
              <span
                className="ledger-source__dot"
                style={{ background: source.color }}
                aria-hidden="true"
              />
              <span className="ledger-source__name">{source.name}</span>
              <span className="ledger-source__detail">{source.detail}</span>
              <span className="ledger-source__amount">
                {formatMoney(source.amount)}
              </span>
            </li>
          ))}
          <li className="ledger-source ledger-source--gap">
            <span
              className="ledger-source__dot"
              style={{ background: GAP_COLOR }}
              aria-hidden="true"
            />
            <span className="ledger-source__name">Uncovered balance</span>
            <span className="ledger-source__detail">
              No funding identified yet
            </span>
            <span className="ledger-source__amount">
              {formatMoney(uncovered)}
            </span>
          </li>
        </ul>
      </section>

      <button type="button" className="ledger-card" onClick={onExploreSupport}>
        <div className="ledger-card__row">
          <div className="ledger-card__labels">
            <span className="ledger-card__title">Support options</span>
            <span className="ledger-card__subtitle">Close the gap</span>
          </div>
          <div className="ledger-card__value-group">
            <span className="ledger-card__value ledger-card__value--gap">
              {formatMoney(uncovered)}
            </span>
            <ChevronRight
              className="ledger-card__chevron"
              size={17}
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </div>
        </div>
        <p className="ledger-card__caption">
          Grants, loans, and tax relief could cover part of your remaining
          balance. See what you may qualify for.
        </p>
      </button>

      <p className="ledger-footnote">
        <span>{view.sources.length} funding sources · synced</span>
        <ChevronDown size={12} strokeWidth={1.75} aria-hidden="true" />
      </p>
    </>
  );
}
