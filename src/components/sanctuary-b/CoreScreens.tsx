import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  Gauge,
  Banknote,
  Landmark,
  Link2,
  Plus,
  Send,
  ShieldCheck,
  Umbrella,
  Upload,
  Wallet,
} from "lucide-react";
import type {
  AssetCategory,
  AssetItem,
  CostView,
  CostViewId,
  ReadinessSection,
} from "../../types";
import type { LedgerTabId } from "../../app/sanctuaryStory";
import type { DetailsOrigin } from "../home/RiskScoreDetails";
import { BorderBeam } from "border-beam";
import { AssetLibrarySheet } from "../home/AssetLibrarySheet";
import {
  assetLibrary,
  assetLibraryTotals,
  costViews,
  exposures,
  readinessSections,
} from "../../data/finance";
import { contentsValue, formatMoney } from "../../data/recovery";
import { riskScore, riskZones } from "../../data/home";
import "./CoreScreens.css";

const TABS: { id: LedgerTabId; label: string; icon: typeof Gauge }[] = [
  { id: "risk", label: "Risk", icon: Gauge },
  { id: "preparedness", label: "Readiness", icon: ShieldCheck },
  { id: "recovery", label: "Recovery", icon: BarChart3 },
];

type CoreScreensProps = {
  onOpenRisk: (origin: DetailsOrigin | null) => void;
  /** Controlled view (both or neither), so the story can route to one. */
  tab?: LedgerTabId;
  onTabChange?: (tab: LedgerTabId) => void;
};

function sectionPct(section: ReadinessSection): number {
  const done = section.items.filter((item) => item.done).length;
  return Math.round((done / section.items.length) * 100);
}

/* Derived once from the static checklist data. */
const documentsDone = readinessSections.reduce(
  (sum, section) => sum + section.items.filter((item) => item.done).length,
  0,
);
const documentsTotal = readinessSections.reduce(
  (sum, section) => sum + section.items.length,
  0,
);
const nextSection = readinessSections.find((section) =>
  section.items.some((item) => !item.done),
);
const nextItem = nextSection?.items.find((item) => !item.done);

/**
 * Sanctuary 4.B core screens — a calm system language built from the
 * reference set: SF type, soft grey boxes instead of outlined cards,
 * halftone-dot data visuals, tick-bar and rounded-bar charts, mini
 * progress rings, one blue accent, and black pill actions. Hierarchy
 * comes from a two-layer stage: the theme's mesh-gradient shader paints
 * a full-bleed top band carrying the tabs and the active view's hero,
 * and a white rounded sheet slides over it with the working content —
 * ink-black cards punctuating the white for contrast.
 */
export function CoreScreens({
  onOpenRisk,
  tab: controlledTab,
  onTabChange,
}: CoreScreensProps) {
  const [internalTab, setInternalTab] = useState<LedgerTabId>("risk");
  const tab = controlledTab ?? internalTab;
  const setTab = onTabChange ?? setInternalTab;
  const [viewId, setViewId] = useState<CostViewId>("total");
  const [assetsOpen, setAssetsOpen] = useState(false);
  // Lifted so the hero's Upload affordance (on the mesh band) can expand
  // a checklist section that lives down in the sheet.
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(
    null,
  );
  // Lifted so items added in the drill-in survive closing the sheet and
  // feed both the readiness math and the library card.
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
  // live (documented value vs. the contents estimate).
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

  /** Upload / next step: expand the section that's missing a document and
   *  bring it into view, so the affordance lands the user where work is. */
  const goToNextSection = () => {
    if (!nextSection) return;
    setExpandedSectionId(nextSection.id);
    requestAnimationFrame(() => {
      document
        .getElementById(`sbc-section-${nextSection.id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  /** Download: a plain-text readiness packet the user can keep or hand off. */
  const downloadSummary = () => {
    const lines = [
      "AidFinder — Aid readiness summary",
      `Overall readiness: ${readinessOverall}%`,
      `Documents on file: ${documentsDone} of ${documentsTotal}`,
      `Belongings documented: ${formatMoney(documented.value)} (${documented.items} items)`,
      "",
      ...readinessSections.flatMap((section) => [
        `${section.name} — ${section.items.filter((i) => i.done).length} of ${section.items.length}`,
        ...section.items.map(
          (item) => `  [${item.done ? "x" : " "}] ${item.name}`,
        ),
        "",
      ]),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "aid-readiness-summary.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="sbc">
      {/* The stage: solid black band carrying the wayfinding and the
          active view's hero reading. The line beam rides its bottom
          edge — an ocean glow traveling the seam behind the sheet. */}
      <BorderBeam size="line" colorVariant="ocean" theme="dark">
        <div className="sbc-mesh">
          <div className="sbc-tabs" role="tablist" aria-label="Home views">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={id === tab}
                aria-label={label}
                title={label}
                className={`sbc-tabs__tab${id === tab ? " is-active" : ""}`}
                onClick={() => setTab(id)}
              >
                <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
              </button>
            ))}
          </div>
          {tab === "risk" && <RiskHero key="risk" />}
          {tab === "preparedness" && (
            <ReadinessHero
              key="preparedness"
              overall={readinessOverall}
              onUpload={goToNextSection}
              onDownload={downloadSummary}
            />
          )}
          {tab === "recovery" && (
            <RecoveryHero
              key="recovery"
              view={view}
              uncovered={uncovered}
              onSelectView={setViewId}
            />
          )}
        </div>
      </BorderBeam>

      {/* The working sheet, sliding over the black stage. Keyed so each
          view re-runs its entrance. */}
      <div className="sbc-sheet">
        <div className="sbc-panel" key={tab}>
          {tab === "risk" && <RiskBody onOpenRisk={onOpenRisk} />}
          {tab === "preparedness" && (
            <ReadinessPanel
              documentedValue={documented.value}
              documentedItems={documented.items}
              documentedPct={documentedPct}
              expandedId={expandedSectionId}
              onExpand={setExpandedSectionId}
              onNextStep={goToNextSection}
              onOpenAssets={() => setAssetsOpen(true)}
            />
          )}
          {tab === "recovery" && (
            <RecoveryPanel
              view={view}
              uncovered={uncovered}
              onExploreSupport={() => navigate("/recovery/support")}
            />
          )}
        </div>
      </div>

      <AssetLibrarySheet
        open={assetsOpen}
        categories={categories}
        estimate={contentsValue}
        appearance="light"
        onAddItem={addAssetItem}
        onClose={() => setAssetsOpen(false)}
      />
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Shared primitives
 * ------------------------------------------------------------------------- */

/** Circle-bordered chevron affordance, per the reference cards. */
function CircleChevron({ open }: { open?: boolean }) {
  return (
    <span className="sbc-circle-chevron" aria-hidden="true">
      {open === undefined ? (
        <ChevronRight size={14} strokeWidth={1.75} />
      ) : (
        <ChevronDown
          size={14}
          strokeWidth={1.75}
          className={open ? "is-open" : ""}
        />
      )}
    </span>
  );
}

/** Small progress ring with the percentage inside, per the reference. */
function MiniRing({ pct }: { pct: number }) {
  const r = 14.5;
  const c = 2 * Math.PI * r;
  return (
    <svg className="sbc-ring" viewBox="0 0 36 36" aria-hidden="true">
      <circle className="sbc-ring__track" cx="18" cy="18" r={r} />
      <circle
        className="sbc-ring__fill"
        cx="18"
        cy="18"
        r={r}
        strokeDasharray={`${(pct / 100) * c} ${c}`}
        transform="rotate(-90 18 18)"
      />
      <text className="sbc-ring__text" x="18" y="19">
        {pct}%
      </text>
    </svg>
  );
}

/** The reference's credit-score strip: thin rounded ticks with the scale's
 *  endpoints beneath, so the reading is legible at a glance. */
function TickBar({
  fraction,
  min,
  max,
}: {
  fraction: number;
  min: number;
  max: number;
}) {
  const count = 44;
  const filled = Math.round(count * fraction);
  return (
    <div className="sbc-scale">
      <div className="sbc-ticks" aria-hidden="true">
        {Array.from({ length: count }, (_, i) => (
          <span
            key={i}
            className={`sbc-ticks__tick${i < filled ? " is-filled" : ""}`}
          />
        ))}
      </div>
      <div className="sbc-scale__ends" aria-hidden="true">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Risk — score hero on the black stage, exposure cards on the sheet.
 * ------------------------------------------------------------------------- */

/**
 * The zone meter, matching the reference dashboard: the resting zones
 * form one fat continuous sausage whose body necks down into a smooth
 * waist at each boundary — no gaps — while the zone holding the score
 * breaks fully away as its own capsule. A pale tick drops through the
 * break with a heart floating above it. Numerals sit under the start
 * and each internal boundary; no max label.
 */
function RiskZoneBar({ value, max }: { value: number; max: number }) {
  const W = 344;
  const MID = 36; // bar centerline
  const R = 16; // half-height of the body
  const NECK = 11; // half-height at a waist
  const WP = 26; // half-width of a waist's easing
  const G = 3.5; // half-gap where the active zone breaks away
  const activeIndex = riskZones.findIndex(
    (zone) => value >= zone.from && value <= zone.to,
  );
  const bx = (v: number) => (v / max) * W;

  // One closed path for a run of connected zones: capsule ends, and a
  // smooth hourglass waist dipping to NECK at each internal boundary.
  const runPath = (x0: number, x1: number, pinches: number[]) => {
    let d = `M ${x0 + R} ${MID - R}`;
    for (const p of pinches) {
      d += ` L ${p - WP} ${MID - R}`;
      d += ` C ${p - WP * 0.4} ${MID - R} ${p - WP * 0.62} ${MID - NECK} ${p} ${MID - NECK}`;
      d += ` C ${p + WP * 0.62} ${MID - NECK} ${p + WP * 0.4} ${MID - R} ${p + WP} ${MID - R}`;
    }
    d += ` L ${x1 - R} ${MID - R}`;
    d += ` A ${R} ${R} 0 0 1 ${x1 - R} ${MID + R}`;
    for (const p of [...pinches].reverse()) {
      d += ` L ${p + WP} ${MID + R}`;
      d += ` C ${p + WP * 0.4} ${MID + R} ${p + WP * 0.62} ${MID + NECK} ${p} ${MID + NECK}`;
      d += ` C ${p - WP * 0.62} ${MID + NECK} ${p - WP * 0.4} ${MID + R} ${p - WP} ${MID + R}`;
    }
    d += ` L ${x0 + R} ${MID + R}`;
    d += ` A ${R} ${R} 0 0 1 ${x0 + R} ${MID - R}`;
    return d + " Z";
  };

  // Contiguous runs of resting zones on either side of the active one.
  const runs: { x0: number; x1: number; pinches: number[] }[] = [];
  let run: { x0: number; x1: number; pinches: number[] } | null = null;
  riskZones.forEach((zone, i) => {
    if (i === activeIndex) {
      if (run) runs.push(run);
      run = null;
      return;
    }
    const x1 = bx(zone.to + 1) - (i + 1 === activeIndex ? G : 0);
    if (run) {
      run.pinches.push(bx(zone.from));
      run.x1 = x1;
    } else {
      run = { x0: bx(zone.from) + (i - 1 === activeIndex ? G : 0), x1, pinches: [] };
    }
  });
  if (run) runs.push(run);

  const active = riskZones[activeIndex];
  const activeX0 = bx(active.from) + (activeIndex > 0 ? G : 0);
  const activeX1 =
    bx(active.to + 1) - (activeIndex < riskZones.length - 1 ? G : 0);

  // The tick rides the break where the active zone pulls away.
  const tickX = activeIndex > 0 ? bx(active.from) : bx(active.to + 1);

  return (
    <svg
      className="sbc-zonebar"
      viewBox={`0 0 ${W} 76`}
      role="img"
      aria-label={`Score ${value} of ${max}, in the ${active?.label ?? ""} zone`}
    >
      <defs>
        {/* One continuous spectrum shared by every piece. */}
        <linearGradient
          id="sbc-zone-spectrum"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2={W}
          y2="0"
        >
          <stop offset="0" stopColor="#30d158" />
          <stop offset="0.32" stopColor="#a8e05f" />
          <stop offset="0.52" stopColor="#ffd60a" />
          <stop offset="0.74" stopColor="#ff9f0a" />
          <stop offset="1" stopColor="#ff453a" />
        </linearGradient>
      </defs>

      {runs.map((r) => (
        <path
          key={r.x0}
          d={runPath(r.x0, r.x1, r.pinches)}
          fill="url(#sbc-zone-spectrum)"
        />
      ))}
      <rect
        x={activeX0}
        y={MID - R}
        width={activeX1 - activeX0}
        height={R * 2}
        rx={R}
        fill="url(#sbc-zone-spectrum)"
      />

      {/* You-are-here: heart floating over the pale tick in the break. */}
      <line
        className="sbc-zonebar__tick"
        x1={tickX}
        y1="17"
        x2={tickX}
        y2={MID + R + 3}
      />
      <path
        className="sbc-zonebar__heart"
        d={`M ${tickX} 6.4 c -1.9 -3.6 -6 -2.3 -6 0.8 0 2.4 3.1 4.6 6 6.6 2.9 -2 6 -4.2 6 -6.6 0 -3.1 -4.1 -4.4 -6 -0.8 Z`}
      />

      {/* Start value at the cap, breakpoints under the waists. */}
      <text className="sbc-zonebar__num" x="1" y="72" textAnchor="start">
        0
      </text>
      {riskZones.slice(1).map((zone) => (
        <text
          key={zone.id}
          className="sbc-zonebar__num"
          x={bx(zone.from)}
          y="72"
          textAnchor="middle"
        >
          {zone.from}
        </text>
      ))}
    </svg>
  );
}

/** The score reading, living directly on the black stage — left-aligned
 *  like the reference dashboard, with the delta chip riding the figure. */
function RiskHero() {
  const delta = riskScore.delta ?? 0;
  return (
    <div className="sbc-hero sbc-hero--risk">
      <p className="sbc-hero__label">Risk score</p>
      <div className="sbc-hero__figure-row">
        <p className="sbc-hero__figure">{riskScore.value}</p>
        {delta !== 0 && (
          <span
            className={`sbc-hero__delta${delta < 0 ? " sbc-hero__delta--good" : ""}`}
          >
            {delta > 0 ? "+" : "−"} {Math.abs(delta)} pts
          </span>
        )}
      </div>
      <p className="sbc-hero__zone">{riskScore.label}</p>
      <RiskZoneBar value={riskScore.value} max={riskScore.max} />
      <div className="sbc-hero__notes">
        <span>Updated {riskScore.date}</span>
        {riskScore.nextDate && <span>Next update {riskScore.nextDate}</span>}
      </div>
    </div>
  );
}

function RiskBody({
  onOpenRisk,
}: {
  onOpenRisk: (origin: DetailsOrigin | null) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const pointsTotal = exposures.reduce((sum, e) => sum + e.points, 0);

  return (
    <>
      <section aria-label="Exposure breakdown">
        <p className="sbc-section-label">What's driving it</p>
        <ul className="sbc-cards">
          {exposures.map((exposure) => {
            const expanded = expandedId === exposure.id;
            const share = Math.round((exposure.points / pointsTotal) * 100);
            return (
              <li key={exposure.id}>
                <button
                  type="button"
                  className="sbc-card sbc-card--button"
                  aria-expanded={expanded}
                  onClick={() =>
                    setExpandedId(expanded ? null : exposure.id)
                  }
                >
                  <span className="sbc-card__head">
                    <span className="sbc-card__title">{exposure.name}</span>
                    <CircleChevron open={expanded} />
                  </span>
                  <span className="sbc-card__body">{exposure.description}</span>
                  {expanded && (
                    <span className="sbc-card__detail">{exposure.detail}</span>
                  )}
                  <span className="sbc-card__foot">
                    <span className="sbc-card__tag">{exposure.meta}</span>
                    <MiniRing pct={share} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <button
        type="button"
        className="sbc-cta"
        onClick={(event) => onOpenRisk({ x: event.clientX, y: event.clientY })}
      >
        View recommended actions
      </button>

      <p className="sbc-footnote">
        Scored {riskScore.date}
        <span className="sbc-footnote__dot" aria-hidden="true" />
        {exposures.length} exposures
      </p>
    </>
  );
}

/* ---------------------------------------------------------------------------
 * Readiness — reading on the mesh band, checklist on the sheet.
 * ------------------------------------------------------------------------- */

/** The readiness reading, living directly on the mesh gradient like the
 *  risk score: figure, tick strip, and the primary affordances as frosted
 *  coins riding the band. */
function ReadinessHero({
  overall,
  onUpload,
  onDownload,
}: {
  overall: number;
  onUpload: () => void;
  onDownload: () => void;
}) {
  const navigate = useNavigate();

  const actions = [
    { id: "upload", label: "Upload", icon: Upload, onClick: onUpload },
    { id: "download", label: "Download", icon: Download, onClick: onDownload },
    {
      id: "apply",
      label: "Apply",
      icon: Send,
      onClick: () => navigate("/recovery/support"),
    },
    {
      id: "connect",
      label: "Connect",
      icon: Link2,
      onClick: () => navigate("/profile"),
    },
  ];

  return (
    <div className="sbc-hero">
      <p className="sbc-hero__label">Aid readiness</p>
      <p className="sbc-hero__figure">
        {overall}
        <span className="sbc-hero__unit">%</span>
      </p>
      <p className="sbc-hero__meta">
        ready to apply for aid
        <span className="sbc-hero__meta-dot" aria-hidden="true" />
        {documentsDone} of {documentsTotal} documents
      </p>
      <TickBar fraction={overall / 100} min={0} max={100} />
      <div className="sbc-hero__actions">
        {actions.map(({ id, label, icon: Icon, onClick }) => (
          <button
            key={id}
            type="button"
            className="sbc-hero__action"
            onClick={onClick}
          >
            <span className="sbc-hero__action-icon" aria-hidden="true">
              <Icon size={17} strokeWidth={1.9} />
            </span>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ReadinessPanel({
  documentedValue,
  documentedItems,
  documentedPct,
  expandedId,
  onExpand,
  onNextStep,
  onOpenAssets,
}: {
  documentedValue: number;
  documentedItems: number;
  documentedPct: number;
  expandedId: string | null;
  onExpand: (id: string | null) => void;
  onNextStep: () => void;
  onOpenAssets: () => void;
}) {
  const renderSection = (section: ReadinessSection) => {
    const expanded = expandedId === section.id;
    const pct = sectionPct(section);
    const done = section.items.filter((item) => item.done).length;
    return (
      <li key={section.id} id={`sbc-section-${section.id}`}>
        <button
          type="button"
          className="sbc-task"
          aria-expanded={expanded}
          onClick={() => onExpand(expanded ? null : section.id)}
        >
          <span
            className={`sbc-task__mark${pct === 100 ? " is-done" : ""}`}
            aria-hidden="true"
          >
            {pct === 100 && <Check size={12} strokeWidth={2.5} />}
          </span>
          <span className="sbc-task__labels">
            <span className="sbc-task__name">{section.name}</span>
            <span className="sbc-task__meta">
              {done} of {section.items.length}
              <span className="sbc-task__meta-dot" aria-hidden="true" />
              {pct === 100
                ? "Complete"
                : pct === 0
                  ? "Not started"
                  : "In progress"}
            </span>
          </span>
          <CircleChevron open={expanded} />
        </button>
        {expanded && (
          <ul className="sbc-task__items">
            {section.items.map((item) => (
              <li
                key={item.id}
                className={`sbc-task__item${item.done ? " is-done" : ""}`}
              >
                <span className="sbc-task__item-mark" aria-hidden="true">
                  {item.done && <Check size={10} strokeWidth={2.5} />}
                </span>
                {item.name}
                {!item.done && (
                  <span className="sbc-task__item-hint">Missing</span>
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
      <div className="sbc-stat-pair">
        <div className="sbc-stat">
          <p className="sbc-stat__label">Documents on file</p>
          <p className="sbc-stat__value">
            {documentsDone}{" "}
            <span className="sbc-stat__value-sub">of {documentsTotal}</span>
          </p>
        </div>
        <div className="sbc-stat">
          <p className="sbc-stat__label">Belongings documented</p>
          <p className="sbc-stat__value">{formatMoney(documentedValue)}</p>
        </div>
      </div>

      {nextItem && (
        <button type="button" className="sbc-next" onClick={onNextStep}>
          <span className="sbc-next__labels">
            <span className="sbc-next__kicker">Next step</span>
            <span className="sbc-next__value">
              Add your {nextItem.name.toLowerCase()}
            </span>
          </span>
          <CircleChevron />
        </button>
      )}

      <section aria-label="Readiness by section">
        <p className="sbc-section-label">Readiness by section</p>
        <ul className="sbc-tasks">
          {readinessSections.slice(0, 3).map(renderSection)}

          {/* The asset library row drills into the library itself. */}
          <li>
            <button type="button" className="sbc-task" onClick={onOpenAssets}>
              <span
                className={`sbc-task__mark${documentedPct === 100 ? " is-done" : ""}`}
                aria-hidden="true"
              >
                {documentedPct === 100 && <Check size={12} strokeWidth={2.5} />}
              </span>
              <span className="sbc-task__labels">
                <span className="sbc-task__name">Asset library</span>
                <span className="sbc-task__meta">
                  {documentedItems} belongings
                  <span className="sbc-task__meta-dot" aria-hidden="true" />
                  {documentedPct}% documented
                </span>
              </span>
              <CircleChevron />
            </button>
          </li>

          {readinessSections.slice(3).map(renderSection)}
        </ul>
      </section>

      <section aria-label="Asset library">
        <p className="sbc-section-label">Asset library</p>
        <button
          type="button"
          className="sbc-card sbc-card--button"
          onClick={onOpenAssets}
        >
          <span className="sbc-card__head">
            <span className="sbc-card__title">Documented value</span>
            <CircleChevron />
          </span>
          <span className="sbc-card__body">
            Document belongings and estimated values once — they pre-fill
            insurance claims and aid applications after a disaster.
          </span>
          <span className="sbc-card__foot">
            <span className="sbc-card__stat">
              <span className="sbc-card__stat-value">
                {formatMoney(documentedValue)}
              </span>
              <span className="sbc-card__stat-caption">
                {documentedItems} items · of {formatMoney(contentsValue)}{" "}
                estimate
              </span>
            </span>
            <MiniRing pct={documentedPct} />
          </span>
        </button>
      </section>

      <p className="sbc-footnote">
        {documentsDone} of {documentsTotal} documents on file
        <span className="sbc-footnote__dot" aria-hidden="true" />
        {documentedItems} assets
      </p>
    </>
  );
}

/* ---------------------------------------------------------------------------
 * Recovery — cost figure, segmented funding arc, funding sources.
 * ------------------------------------------------------------------------- */

/** 4.B's blue-and-grey coding: funding sources run ink → grey by weight,
 *  and the accent blue is reserved for the uncovered gap — the one part
 *  of the arc that needs the user's attention. */
const SOURCE_COLORS: Record<string, string> = {
  insurance: "#16181c",
  sba: "#6f7681",
  fema: "#9ba3ae",
  personal: "#cdd2d9",
};
const GAP_COLOR = "#0a7aff";

/** Funding type icons riding each arc segment. */
const SOURCE_ICONS: Record<string, typeof Umbrella> = {
  insurance: Umbrella,
  sba: Banknote,
  fema: Landmark,
  personal: Wallet,
};
/** Light segments need an ink icon for contrast. */
const LIGHT_SEGMENTS = new Set(["personal"]);

function polarPoint(
  cx: number,
  cy: number,
  r: number,
  deg: number,
): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  const [x1, y1] = polarPoint(cx, cy, r, startDeg);
  const [x2, y2] = polarPoint(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

/**
 * Funding composition, per the reference: the cost figure anchors the
 * bottom-left with the uncovered gap as a quiet outlined pill beneath it,
 * while an arc sweeps across the top-right — small grey fragments (the
 * minor sources) building into one fat ink capsule carrying the largest
 * source's share written along the curve, ending in the blue gap segment
 * with a floating plus trailing off the arc as the door to more programs.
 */
function FundingArc({
  view,
  uncovered,
  onExplore,
}: {
  view: CostView;
  uncovered: number;
  onExplore: () => void;
}) {
  // Smallest fragments lead into the big capsule; the gap closes the arc.
  const ordered = [...view.sources].sort((a, b) => a.amount - b.amount);
  const largest = ordered[ordered.length - 1];
  const items = [
    ...ordered.map((source) => ({
      id: source.id,
      amount: source.amount,
      color: SOURCE_COLORS[source.id],
    })),
    ...(uncovered > 0
      ? [{ id: "gap", amount: uncovered, color: GAP_COLOR }]
      : []),
  ];

  // Circle geometry: the arc rides the top-right of the composition and
  // the figure sits in the free bottom-left quadrant. One stroke width
  // for every segment; wide angular gaps keep the round caps apart.
  const CX = 140;
  const CY = 162;
  const R = 118;
  const WIDTH = 34;
  const START = -52;
  const SWEEP = 186;
  const GAP_DEG = 18;
  const available = SWEEP - GAP_DEG * (items.length - 1);

  let cursor = START;
  const segments = items.map((item) => {
    const sweep = (item.amount / view.total) * available;
    const path = arcPath(CX, CY, R, cursor, cursor + sweep);
    const [iconX, iconY] = polarPoint(
      CX,
      CY,
      R,
      item.id === largest.id ? cursor : cursor + sweep / 2,
    );
    cursor += sweep + GAP_DEG;
    return { ...item, path, iconX, iconY };
  });

  const capsuleId = `sbc-capsule-${view.id}`;
  const largestPct = Math.round((largest.amount / view.total) * 100);
  const largestName = largest.name.split("·")[0].trim();

  return (
    <div className="sbc-arc">
      <svg
        className="sbc-arc__svg"
        viewBox="0 0 340 290"
        role="img"
        aria-label={`Funding mix: ${largestName} covers ${largestPct}% of the cost`}
      >
        {segments.map((segment, index) => (
          <path
            key={segment.id}
            id={segment.id === largest.id ? capsuleId : undefined}
            className="sbc-arc__seg"
            d={segment.path}
            stroke={segment.color}
            strokeWidth={WIDTH}
            strokeLinecap="round"
            fill="none"
            style={{ animationDelay: `${index * 70}ms` }}
          />
        ))}
        {/* The largest source's share, written along its capsule. */}
        <text className="sbc-arc__capsule-text" dy="4.5">
          <textPath href={`#${capsuleId}`} startOffset="46%" textAnchor="middle">
            {largestPct}%
          </textPath>
        </text>
      </svg>

      {/* Funding type icons riding their segments. */}
      {segments.map((segment) => {
        const Icon = SOURCE_ICONS[segment.id];
        if (!Icon) return null;
        return (
          <span
            key={segment.id}
            className={`sbc-arc__icon${LIGHT_SEGMENTS.has(segment.id) ? " sbc-arc__icon--ink" : ""}`}
            style={{ left: segment.iconX, top: segment.iconY }}
            aria-hidden="true"
          >
            <Icon size={15} strokeWidth={2} />
          </span>
        );
      })}

      {/* The headline figure lives on the mesh hero above; the arc's free
          quadrant spotlights the actionable number — the uncovered gap. */}
      <div className="sbc-arc__fig">
        <p className="sbc-arc__fig-label">
          {uncovered > 0 ? "Uncovered balance" : "Funding secured"}
        </p>
        <p
          className={`sbc-arc__fig-amount${uncovered > 0 ? " sbc-arc__fig-amount--gap" : ""}`}
        >
          {uncovered > 0 ? formatMoney(uncovered) : "100%"}
        </p>
        {uncovered > 0 && (
          <button
            type="button"
            className="sbc-arc__fig-pill"
            onClick={onExplore}
          >
            Close the gap
          </button>
        )}
      </div>

      {/* The door to more programs, trailing off the arc's tail. */}
      <button
        type="button"
        className="sbc-arc__plus"
        aria-label="Explore more funding programs"
        title="Explore more funding programs"
        onClick={onExplore}
      >
        <Plus size={19} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  );
}

/** The recovery reading on the mesh band: cost-view switcher, the cost
 *  figure, and the uncovered gap as the headline — the arc detail stays
 *  on the sheet below. */
function RecoveryHero({
  view,
  uncovered,
  onSelectView,
}: {
  view: CostView;
  uncovered: number;
  onSelectView: (id: CostViewId) => void;
}) {
  return (
    <div className="sbc-hero" key={view.id}>
      <div className="sbc-hero__views" role="tablist" aria-label="Cost view">
        {costViews.map((option) => (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={option.id === view.id}
            className={`sbc-hero__view${option.id === view.id ? " is-active" : ""}`}
            onClick={() => onSelectView(option.id)}
          >
            {option.tab}
          </button>
        ))}
      </div>
      <p className="sbc-hero__figure sbc-hero__figure--money">
        {formatMoney(view.total)}
      </p>
      <p className="sbc-hero__meta">
        {view.heading.toLowerCase()}
        {uncovered > 0 && (
          <>
            <span className="sbc-hero__meta-dot" aria-hidden="true" />
            {formatMoney(uncovered)} uncovered
          </>
        )}
      </p>
    </div>
  );
}

function RecoveryPanel({
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
      {/* Keyed so the arc re-runs its entrance per view. */}
      <div className="sbc-outlook__reading" key={view.id}>
        <FundingArc
          view={view}
          uncovered={uncovered}
          onExplore={onExploreSupport}
        />
      </div>

      <section aria-label="Funding sources">
        <p className="sbc-section-label">Where funding comes from</p>
        <div className="sbc-card">
          <ul className="sbc-sources">
            {view.sources.map((source) => (
              <li key={source.id} className="sbc-source">
                <span
                  className="sbc-source__dot"
                  style={{ background: SOURCE_COLORS[source.id] }}
                  aria-hidden="true"
                />
                <span className="sbc-source__labels">
                  <span className="sbc-source__name">{source.name}</span>
                  <span className="sbc-source__detail">{source.detail}</span>
                </span>
                <span className="sbc-source__amount">
                  {formatMoney(source.amount)}
                </span>
              </li>
            ))}
            <li className="sbc-source sbc-source--gap">
              <span
                className="sbc-source__dot"
                style={{ background: GAP_COLOR }}
                aria-hidden="true"
              />
              <span className="sbc-source__labels">
                <span className="sbc-source__name">Uncovered balance</span>
                <span className="sbc-source__detail">
                  No funding identified yet
                </span>
              </span>
              <span className="sbc-source__amount">
                {formatMoney(uncovered)}
              </span>
            </li>
          </ul>
        </div>
      </section>

      <button type="button" className="sbc-cta" onClick={onExploreSupport}>
        Explore support options
      </button>

      <p className="sbc-footnote">
        {view.sources.length} funding sources
        <span className="sbc-footnote__dot" aria-hidden="true" />
        synced with your policy
      </p>
    </>
  );
}
