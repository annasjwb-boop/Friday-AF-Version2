import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  HandCoins,
  Map,
  ShieldCheck,
  X,
} from "lucide-react";
import { AidFinderMark } from "../mobile/DashboardAgentToggle";
import {
  readinessCards,
  readinessProgress,
  riskActions,
  riskScore,
} from "../../data/home";
import {
  disasterOptions,
  formatMoney,
  formatMoneyCompact,
  supportCategoryMeta,
  supportOptions,
} from "../../data/recovery";
import {
  assetCategoryTotal,
  assetLibrary,
  assetLibraryTotals,
  readinessSections,
} from "../../data/finance";
import type { ReadinessSection } from "../../types";
import { computePlan, loadTuning, POLICY } from "../casita/recoveryPlan";
import {
  METAPHOR_LABELS,
  METAPHOR_NAMES,
  METAPHOR_STORIES,
  METAPHORS,
  type MetaphorId,
} from "../casita/metaphors";
import { getTurntableFrames } from "../casita/turntableFrames";
import "./DesktopHome.css";

const ProductOrbit = lazy(() =>
  import("../casita/ProductOrbit").then((m) => ({ default: m.ProductOrbit })),
);

/* ---------------------------------------------------------------------------
 * Desktop AidFinder — a widescreen take on the Casita Maquette (variant 9).
 * Product chrome (brand, risk map, contact, profile) frames a self-contained
 * canvas. Inside: the property switcher up top, the member's diorama as the
 * canvas backdrop, the risk tick-strip beneath it, and the money cards
 * floating on either side.
 * ------------------------------------------------------------------------- */

const METAPHOR_STORAGE_KEY = "aidfinder:casita-metaphor";

/* Layout variants under evaluation: "framed" keeps the rounded canvas with a
   hairline edge; "flat" removes the canvas so content sits on the page. */
type DeskFrame = "framed" | "flat";

const FRAME_STORAGE_KEY = "aidfinder:desk-frame";

function loadFrame(): DeskFrame {
  return localStorage.getItem(FRAME_STORAGE_KEY) === "flat" ? "flat" : "framed";
}

type Property = {
  id: string;
  name: string;
  address: string;
  /** null = the member's chosen metaphor, shared with the mobile app. */
  defaultMetaphor: MetaphorId | null;
  risk: { value: number; label: string; position: number };
  /** Scales the recovery-plan dollars for this property's size. */
  planScale: number;
  /** One-line character note shown for non-primary properties. */
  blurb: string;
};

const PROPERTIES: Property[] = [
  {
    id: "prado",
    name: "Primary Residence",
    address: "123 Prado Rd NE, Atlanta, GA",
    defaultMetaphor: null,
    risk: {
      value: riskScore.value,
      label: riskScore.label,
      position: riskScore.position,
    },
    planScale: 1,
    blurb: "",
  },
  {
    id: "ellijay",
    name: "Mountain Cabin",
    address: "48 Blue Ridge Overlook, Ellijay, GA",
    defaultMetaphor: "cabin",
    risk: { value: 415, label: "Manageable", position: 0.415 },
    planScale: 0.55,
    blurb:
      "Tucked into the Blue Ridge tree line — wildfire season is the number to watch, but defensible space keeps this one manageable.",
  },
  {
    id: "tybee",
    name: "Beach Rental",
    address: "902 Seagrove Ln, Tybee Island, GA",
    defaultMetaphor: "lighthouse",
    risk: { value: 745, label: "Elevated", position: 0.745 },
    planScale: 0.8,
    blurb:
      "Four blocks off the Atlantic with no flood policy on file — storm surge is what pushes this score into the Elevated band.",
  },
];

function metaphorKey(property: Property): string {
  return property.defaultMetaphor === null
    ? METAPHOR_STORAGE_KEY
    : `aidfinder:desk-metaphor:${property.id}`;
}

function loadMetaphorFor(property: Property): MetaphorId {
  const stored = localStorage.getItem(metaphorKey(property));
  if (METAPHORS.includes(stored as MetaphorId)) return stored as MetaphorId;
  return property.defaultMetaphor ?? "sanctuary";
}

const TICK_COUNT = 44;

type DeskTab = "overview" | "actions" | "applications";

const DESK_TABS: { id: DeskTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "actions", label: "Actions" },
  { id: "applications", label: "Applications" },
];

/** Small progress ring with the percentage inside, à la shipping widgets. */
function Ring({ pct }: { pct: number }) {
  const size = 52;
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="desk-ring"
      role="img"
      aria-label={`${pct}%`}
    >
      <circle className="desk-ring__track" cx={26} cy={26} r={r} />
      <circle
        className="desk-ring__fill"
        cx={26}
        cy={26}
        r={r}
        strokeDasharray={`${(Math.min(pct, 100) / 100) * c} ${c}`}
        transform="rotate(-90 26 26)"
      />
      <text className="desk-ring__text" x="26" y="30">
        {pct}%
      </text>
    </svg>
  );
}

export function DesktopHome() {
  const [propertyId, setPropertyId] = useState(PROPERTIES[0].id);
  const [tab, setTab] = useState<DeskTab>("overview");
  const [frame, setFrame] = useState<DeskFrame>(loadFrame);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [readinessOpen, setReadinessOpen] = useState(false);
  const [armed, setArmed] = useState(false);
  const stageTap = useRef<{ x: number; y: number; t: number } | null>(null);

  const property =
    PROPERTIES.find((p) => p.id === propertyId) ?? PROPERTIES[0];
  const [metaphor, setMetaphor] = useState<MetaphorId>(() =>
    loadMetaphorFor(property),
  );

  /* Same plan state the mobile Recovery tab reads — one prototype, one truth. */
  const tuning = useMemo(loadTuning, []);
  const plan = useMemo(() => computePlan(tuning), [tuning]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setArmed(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    localStorage.setItem(FRAME_STORAGE_KEY, frame);
  }, [frame]);

  const frames = getTurntableFrames(metaphor);
  const disaster =
    disasterOptions
      .find((d) => d.id === tuning.disasterType)
      ?.label.toLowerCase() ?? "disaster";

  /* Dollars scale with the property; the funding shape stays the same. */
  const scale = property.planScale;
  const total = Math.round(plan.total * scale);
  const insurance = Math.round(plan.insurance * scale);
  const gap = Math.round(plan.gap * scale);
  const fundedPct = Math.round((plan.funded / plan.total) * 100);
  const insurancePct = Math.round((plan.insurance / plan.total) * 100);
  const outsideSum = Math.round(
    supportOptions
      .filter((o) => tuning.supportIds.includes(o.id))
      .reduce((sum, o) => sum + o.estimatedAmount, 0) * scale,
  );
  const filledTicks = Math.round(property.risk.position * TICK_COUNT);

  const chooseProperty = (next: Property) => {
    setPropertyId(next.id);
    setMetaphor(loadMetaphorFor(next));
    setSwitcherOpen(false);
  };

  const selectMetaphor = (next: MetaphorId) => {
    setMetaphor(next);
    localStorage.setItem(metaphorKey(property), next);
    setPickerOpen(false);
  };

  /* One switcher, two homes: it sits in the canvas header when framed, and
     replaces the wordmark next to the brand icon when flat. */
  const propertySwitcher = (
    <div className="desk__property">
      <button
        type="button"
        className="desk__property-btn"
        aria-expanded={switcherOpen}
        aria-haspopup="listbox"
        onClick={() => setSwitcherOpen((open) => !open)}
      >
        <span className="desk__property-name">{property.name}</span>
        <span className="desk__property-address">{property.address}</span>
        <ChevronDown
          size={15}
          strokeWidth={2.2}
          className={`desk__property-chevron${switcherOpen ? " is-open" : ""}`}
          aria-hidden="true"
        />
      </button>
      {switcherOpen && (
        <>
          <div
            className="desk__property-backdrop"
            onClick={() => setSwitcherOpen(false)}
            aria-hidden="true"
          />
          <ul className="desk__property-menu" role="listbox">
            {PROPERTIES.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={p.id === property.id}
                  className={`desk__property-option${
                    p.id === property.id ? " is-active" : ""
                  }`}
                  onClick={() => chooseProperty(p)}
                >
                  <span className="desk__property-name">{p.name}</span>
                  <span className="desk__property-address">{p.address}</span>
                  <span
                    className={`desk__property-score is-${p.risk.label.toLowerCase()}`}
                  >
                    {p.risk.value} · {p.risk.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );

  return (
    <div className={`desk desk--${frame}`}>
      <header className="desk__chrome">
        <span className="desk__brand">
          <span className="desk__brand-icon" aria-hidden="true">
            <AidFinderMark />
          </span>
          {frame === "flat" ? (
            propertySwitcher
          ) : (
            <span className="desk__wordmark">AidFinder</span>
          )}
        </span>
        <nav className="desk__tabs" role="tablist" aria-label="Sections">
          {DESK_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`desk__tab${tab === t.id ? " is-active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <nav className="desk__nav" aria-label="Product">
          <button type="button" className="desk__nav-link">
            Contact Us
          </button>
          <button type="button" className="desk__nav-cta">
            <Map size={15} strokeWidth={2} aria-hidden="true" />
            View Risk Map
          </button>
          <button type="button" className="desk__avatar" aria-label="Profile">
            <span aria-hidden="true">JB</span>
          </button>
        </nav>
      </header>

      <main className="desk__canvas">
        {frame === "framed" && (
          <header className="desk__top">
            {propertySwitcher}
            <span className="desk__updated">
              Risk profile updated {riskScore.date}
            </span>
          </header>
        )}

        {tab === "actions" && <DeskActions />}
        {tab === "applications" && (
          <DeskApplications supportIds={tuning.supportIds} scale={scale} />
        )}

        {tab === "overview" && (
        <div
          className="desk__stage"
          onPointerDown={(e) => {
            stageTap.current = { x: e.clientX, y: e.clientY, t: Date.now() };
          }}
          onPointerUp={(e) => {
            const down = stageTap.current;
            stageTap.current = null;
            if (!down) return;
            const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
            if (moved < 8 && Date.now() - down.t < 350) setPickerOpen(true);
          }}
        >
          <Suspense fallback={null}>
            <ProductOrbit
              key={metaphor}
              frames={frames}
              contain
              alt={`Diorama of ${METAPHOR_NAMES[metaphor]}. Drag to rotate, click to choose a different home.`}
            />
          </Suspense>
        </div>
        )}

        {tab === "overview" && (
        <div className="desk__grid">
          <div className="desk__col">
            <article className="desk-card">
              <header className="desk-card__head">
                <h2 className="desk-card__title">Insurance</h2>
                <button
                  type="button"
                  className="desk-card__more"
                  aria-label="Insurance details"
                >
                  <ChevronRight size={14} strokeWidth={2.2} />
                </button>
              </header>
              <p className="desk-card__text">
                Your policy pays about {Math.round(POLICY.dwellingShare * 100)}
                % of structure damage after the deductible, up to the{" "}
                {formatMoneyCompact(POLICY.dwellingLimit)} dwelling limit.
              </p>
              <p className="desk-card__text">
                Flood and earthquake aren&rsquo;t covered — each needs its own
                policy.
              </p>
              <footer className="desk-card__foot">
                <div className="desk-card__figure">
                  <span className="desk-card__value">
                    {formatMoneyCompact(insurance)}
                    <span className="desk-card__of">
                      /{formatMoneyCompact(total)}
                    </span>
                  </span>
                  <span className="desk-card__label">
                    Pays in this {disaster}
                  </span>
                </div>
                <Ring pct={insurancePct} />
              </footer>
            </article>

            <button
              type="button"
              className="desk-card desk-card--tinted desk-card--drill"
              onClick={() => setReadinessOpen(true)}
              aria-label="Aid readiness — view documents and home inventory"
            >
              <div className="desk-card__badge">
                <ShieldCheck size={15} strokeWidth={2.2} aria-hidden="true" />
              </div>
              <span className="desk-card__big">{readinessProgress}%</span>
              <p className="desk-card__text">
                Aid readiness — 2 of 6 tasks done. Connect state records and
                photos to speed up applications.
              </p>
              <span className="desk-card__drill-hint" aria-hidden="true">
                <ChevronRight size={14} strokeWidth={2.2} />
              </span>
            </button>
          </div>

          <div className="desk__center">
            <div className="desk__score">
              <p className="desk__score-line">
                Your <strong>risk score</strong> is{" "}
                <strong>{property.risk.value}</strong>
              </p>
              <p className="desk__score-sub">
                This score is considered {property.risk.label}.
              </p>
              <div
                className={`desk__ticks${armed ? " is-armed" : ""}`}
                role="img"
                aria-label={`Risk score ${property.risk.value} of ${riskScore.max}`}
              >
                {Array.from({ length: TICK_COUNT }, (_, i) => (
                  <i
                    key={i}
                    className={i < filledTicks ? "is-on" : ""}
                    style={{ transitionDelay: `${i * 14}ms` }}
                  />
                ))}
              </div>
              <p className="desk__story">
                {property.blurb || METAPHOR_STORIES[metaphor]}
              </p>
            </div>
          </div>

          <div className="desk__col">
            <article className="desk-card desk-card--tinted">
              <div className="desk-card__badge">
                <HandCoins size={15} strokeWidth={2.2} aria-hidden="true" />
              </div>
              <span className="desk-card__big">
                {formatMoneyCompact(outsideSum)}+
              </span>
              <p className="desk-card__text">
                in federal aid estimated for your plan if a disaster is
                declared.
              </p>
            </article>

            <article className="desk-card">
              <header className="desk-card__head">
                <h2 className="desk-card__title">Recovery Plan</h2>
                <button
                  type="button"
                  className="desk-card__more"
                  aria-label="Recovery plan details"
                >
                  <ChevronRight size={14} strokeWidth={2.2} />
                </button>
              </header>
              <p className="desk-card__text">
                Insurance, your money, and outside aid ladder up against the{" "}
                {formatMoneyCompact(total)} a total-loss {disaster} would
                cost.
              </p>
              <p className="desk-card__text">
                Whatever they don&rsquo;t reach is the gap you&rsquo;d carry
                alone.
              </p>
              <footer className="desk-card__foot">
                <div className="desk-card__figure">
                  <span
                    className={`desk-card__value${gap > 0 ? " is-gap" : ""}`}
                  >
                    {formatMoneyCompact(gap)}
                  </span>
                  <span className="desk-card__label">Unfunded gap</span>
                </div>
                <Ring pct={fundedPct} />
              </footer>
            </article>
          </div>
        </div>
        )}

        <AnimatePresence>
          {pickerOpen && (
            <DeskHomePicker
              current={metaphor}
              onSelect={selectMetaphor}
              onClose={() => setPickerOpen(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {readinessOpen && (
            <DeskReadiness onClose={() => setReadinessOpen(false)} />
          )}
        </AnimatePresence>
      </main>

      {/* Prototype-only switch for comparing the two layout directions. */}
      <div
        className="desk__variant"
        role="radiogroup"
        aria-label="Layout variant"
      >
        <button
          type="button"
          role="radio"
          aria-checked={frame === "framed"}
          className={`desk__variant-btn${frame === "framed" ? " is-active" : ""}`}
          onClick={() => setFrame("framed")}
        >
          V1 · Framed
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={frame === "flat"}
          className={`desk__variant-btn${frame === "flat" ? " is-active" : ""}`}
          onClick={() => setFrame("flat")}
        >
          V2 · Flat
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Home picker — a dedicated selection view that takes over the canvas.
 * Same flow as the mobile picker: cycle the ten dioramas, read the story
 * tied to your live numbers, confirm to make one yours.
 * ------------------------------------------------------------------------- */

const SLIDE_W = 560;
const SLIDE_EASE = { duration: 0.5, ease: [0.32, 0.72, 0, 1] as const };

function DeskHomePicker({
  current,
  onSelect,
  onClose,
}: {
  current: MetaphorId;
  onSelect: (metaphor: MetaphorId) => void;
  onClose: () => void;
}) {
  const [candidate, setCandidate] = useState<MetaphorId>(current);
  /* Which slide's orbit has finished loading — drives the img/orbit
     crossfade so the static frame never fades before the orbit can draw. */
  const [readyFor, setReadyFor] = useState<MetaphorId | null>(null);
  /* The slide the track has come to rest on. WebGL contexts are only
     created/destroyed at rest — mounting one mid-slide janks the track. */
  const [settledOn, setSettledOn] = useState<MetaphorId>(current);
  const index = METAPHORS.indexOf(candidate);
  const isCurrent = candidate === current;

  const step = (dir: -1 | 1) =>
    setCandidate((c) => {
      const next = METAPHORS.indexOf(c) + dir;
      return METAPHORS[Math.max(0, Math.min(METAPHORS.length - 1, next))];
    });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="desk-picker"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
    >
      <header className="desk-picker__head">
        <span className="desk-picker__heading">Choose your home</span>
        <button
          type="button"
          className="desk-picker__close"
          aria-label="Close"
          onClick={onClose}
        >
          <X size={17} strokeWidth={2.2} />
        </button>
      </header>

      <div className="desk-picker__carousel">
        <motion.div
          className="desk-picker__track"
          initial={false}
          animate={{ x: -SLIDE_W / 2 - index * SLIDE_W }}
          transition={SLIDE_EASE}
          onAnimationComplete={() => setSettledOn(candidate)}
        >
          {METAPHORS.map((id, i) => {
            const active = i === index;
            const showOrbit = active && settledOn === id && readyFor === id;
            return (
              <motion.div
                key={id}
                className={`desk-picker__slide${active ? " is-active" : ""}`}
                initial={false}
                animate={{
                  scale: active ? 1 : 0.68,
                  opacity: active ? 1 : 0.4,
                }}
                transition={SLIDE_EASE}
                onClick={() => !active && setCandidate(id)}
                role={active ? undefined : "button"}
                aria-label={active ? undefined : METAPHOR_NAMES[id]}
              >
                {/* Static frame and live orbit crossfade in place. The orbit
                    mounts only once the track is at rest and fades in only
                    once its textures have drawn; when the slide leaves, it
                    fades back to the hero frame and unmounts at the next
                    rest point — GL work never lands mid-animation. */}
                <motion.img
                  src={getTurntableFrames(id)[0]}
                  alt=""
                  draggable={false}
                  aria-hidden="true"
                  initial={false}
                  animate={{ opacity: showOrbit ? 0 : 1 }}
                  transition={{ duration: 0.25 }}
                />
                {settledOn === id && (
                  <motion.div
                    className="desk-picker__orbit"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: showOrbit ? 1 : 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Suspense fallback={null}>
                      <ProductOrbit
                        frames={getTurntableFrames(id)}
                        contain
                        onReady={() => setReadyFor(id)}
                        alt={`Studio rendering of the ${METAPHOR_LABELS[id]}`}
                      />
                    </Suspense>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        <button
          type="button"
          className="desk-picker__arrow desk-picker__arrow--prev"
          aria-label="Previous home"
          disabled={index === 0}
          onClick={() => step(-1)}
        >
          <ChevronLeft size={20} strokeWidth={2.2} />
        </button>
        <button
          type="button"
          className="desk-picker__arrow desk-picker__arrow--next"
          aria-label="Next home"
          disabled={index === METAPHORS.length - 1}
          onClick={() => step(1)}
        >
          <ChevronRight size={20} strokeWidth={2.2} />
        </button>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={candidate}
          className="desk-picker__story"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
        >
          <h2 className="desk-picker__name">
            {METAPHOR_NAMES[candidate]}
            {isCurrent && (
              <span className="desk-picker__badge">Your home</span>
            )}
          </h2>
          <p className="desk-picker__text">{METAPHOR_STORIES[candidate]}</p>
        </motion.div>
      </AnimatePresence>

      <footer className="desk-picker__foot">
        <button
          type="button"
          className="desk-picker__cta"
          disabled={isCurrent}
          onClick={() => onSelect(candidate)}
        >
          {isCurrent ? "This is your home" : "Make this my home"}
        </button>
      </footer>
    </motion.div>
  );
}

/* ---------------------------------------------------------------------------
 * Aid readiness drill-in — takes over the canvas like the home picker.
 * Left: the document checklist behind the readiness percentage. Right: the
 * home inventory — documented belongings with estimated replacement values.
 * Same data the mobile ledger reads.
 * ------------------------------------------------------------------------- */

/** Full-contents estimate the inventory is documented against (see finance.ts). */
const CONTENTS_ESTIMATE = 90000;

function DeskReadiness({ onClose }: { onClose: () => void }) {
  /* Local checklist state: rows toggle so the drill-in stays a working
     surface, not a static mockup. Resets on close, like the sanctuary labs. */
  const [sections, setSections] = useState<ReadinessSection[]>(
    readinessSections,
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toggleItem = (sectionId: string, itemId: string) =>
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map((item) =>
                item.id === itemId ? { ...item, done: !item.done } : item,
              ),
            }
          : section,
      ),
    );

  const docsDone = sections.reduce(
    (n, s) => n + s.items.filter((i) => i.done).length,
    0,
  );
  const docsTotal = sections.reduce((n, s) => n + s.items.length, 0);
  const inventory = assetLibraryTotals(assetLibrary);
  const documentedPct = Math.round((inventory.value / CONTENTS_ESTIMATE) * 100);

  return (
    <motion.div
      className="desk-readiness"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
    >
      <header className="desk-picker__head">
        <span className="desk-picker__heading">Aid readiness</span>
        <button
          type="button"
          className="desk-picker__close"
          aria-label="Close"
          onClick={onClose}
        >
          <X size={17} strokeWidth={2.2} />
        </button>
      </header>

      <p className="desk-readiness__sub">
        Everything here pre-fills insurance claims and aid applications after
        a disaster — you tell your story once. Documents prove who you are and
        what you own; the inventory prices what you'd need to replace.
      </p>

      <div className="desk-readiness__grid">
        <section className="desk-readiness__col" aria-label="Documents">
          <h2 className="desk__page-label">
            Documents
            <span className="desk__page-label-note">
              {docsDone} of {docsTotal} on file
            </span>
          </h2>
          {sections.map((section) => {
            const done = section.items.filter((i) => i.done).length;
            return (
              <article key={section.id} className="desk-card">
                <header className="desk-readiness__section-head">
                  <div>
                    <h3 className="desk-action__title">{section.name}</h3>
                    <span className="desk-readiness__meta">
                      {section.meta}
                    </span>
                  </div>
                  <span className="desk-readiness__count">
                    {done}/{section.items.length}
                  </span>
                </header>
                <ul className="desk-readiness__rows">
                  {section.items.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={`desk-readiness__row${item.done ? " is-done" : ""}`}
                        aria-pressed={item.done}
                        onClick={() => toggleItem(section.id, item.id)}
                      >
                        <span
                          className="desk-readiness__check"
                          aria-hidden="true"
                        >
                          {item.done && <Check size={11} strokeWidth={3} />}
                        </span>
                        <span className="desk-readiness__row-name">
                          {item.name}
                        </span>
                        <span className="desk-readiness__row-status">
                          {item.done ? "On file" : "Add"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </section>

        <section className="desk-readiness__col" aria-label="Home inventory">
          <h2 className="desk__page-label">
            Home inventory
            <span className="desk__page-label-note">
              {inventory.items} items · {formatMoneyCompact(inventory.value)}{" "}
              documented
            </span>
          </h2>
          <p className="desk__page-note desk-readiness__note">
            That's {documentedPct}% of the{" "}
            {formatMoneyCompact(CONTENTS_ESTIMATE)} your belongings are
            estimated to be worth — anything undocumented is harder to claim
            after a loss.
          </p>
          {assetLibrary.map((category) => (
            <article key={category.id} className="desk-card">
              <header className="desk-readiness__section-head">
                <h3 className="desk-action__title">{category.label}</h3>
                <span className="desk-readiness__count">
                  {category.items.length} items ·{" "}
                  {formatMoneyCompact(assetCategoryTotal(category))}
                </span>
              </header>
              <ul className="desk-readiness__rows">
                {category.items.map((item) => (
                  <li key={item.id} className="desk-readiness__asset">
                    <span className="desk-readiness__row-name">
                      {item.name}
                    </span>
                    <span className="desk-readiness__value">
                      {formatMoney(item.value)}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      </div>
    </motion.div>
  );
}

/* ---------------------------------------------------------------------------
 * Actions tab — the moves that lower the risk score, and the readiness
 * checklist that speeds up aid. Same data the mobile Risk tab uses.
 * ------------------------------------------------------------------------- */

function DeskActions() {
  return (
    <div className="desk__page">
      <header className="desk__page-head">
        <h1 className="desk__page-title">Actions</h1>
        <p className="desk__page-sub">
          Three moves would take this home from Exposed toward Manageable —
          and a finished checklist means aid arrives weeks sooner.
        </p>
      </header>

      <div className="desk__page-grid">
        <section className="desk__page-col" aria-label="Lower your risk score">
          <h2 className="desk__page-label">Lower your risk score</h2>
          {riskActions.map((action) => (
            <article key={action.id} className="desk-card desk-action">
              <header className="desk-action__head">
                <h3 className="desk-action__title">{action.title}</h3>
                <span className="desk-action__points">
                  −{action.points} pts
                </span>
              </header>
              <p className="desk-action__subtitle">{action.subtitle}</p>
              <p className="desk-card__text">{action.description}</p>
              <footer className="desk-action__foot">
                <span className="desk-action__detail">{action.detail}</span>
                <a
                  className="desk-action__link"
                  href={action.exploreUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Explore
                  <ArrowUpRight size={13} strokeWidth={2.2} aria-hidden="true" />
                </a>
              </footer>
            </article>
          ))}
        </section>

        <section className="desk__page-col" aria-label="Get aid-ready">
          <h2 className="desk__page-label">
            Get aid-ready
            <span className="desk__page-label-note">
              {readinessProgress}% · 2 of 6 done
            </span>
          </h2>
          {readinessCards.map((card) => (
            <article key={card.id} className="desk-card desk-task">
              <div className="desk-task__body">
                <h3 className="desk-action__title">{card.title}</h3>
                <p className="desk-card__text">{card.description}</p>
              </div>
              <button type="button" className="desk-task__btn">
                {card.action}
              </button>
            </article>
          ))}
          <p className="desk__page-note">
            Done already: verify identity, add your insurance policy. Each
            finished task pre-fills the applications on the next tab.
          </p>
        </section>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Applications tab — every program in the member's plan, staged and ready
 * to file the day a disaster is declared.
 * ------------------------------------------------------------------------- */

const APPLICATION_STATUS: Record<
  string,
  { label: string; tone: "ready" | "progress" | "attention" | "idle" }
> = {
  "fema-sna": { label: "Ready to file", tone: "ready" },
  "fema-ihp": { label: "Draft · 60% complete", tone: "progress" },
  "sba-home": { label: "2 documents needed", tone: "attention" },
  "sba-property": { label: "Not started", tone: "idle" },
  "irs-relief": { label: "Auto-applies at filing", tone: "ready" },
};

function DeskApplications({
  supportIds,
  scale,
}: {
  supportIds: string[];
  scale: number;
}) {
  const planTotal = Math.round(
    supportOptions
      .filter((o) => supportIds.includes(o.id))
      .reduce((sum, o) => sum + o.estimatedAmount, 0) * scale,
  );

  return (
    <div className="desk__page">
      <header className="desk__page-head">
        <h1 className="desk__page-title">Applications</h1>
        <p className="desk__page-sub">
          {formatMoneyCompact(planTotal)}+ staged across{" "}
          {supportIds.length} programs. Drafts are prepared now so filing
          takes minutes — not weeks — once a disaster is declared.
        </p>
      </header>

      <div className="desk__apps">
        {supportOptions.map((option) => {
          const status = APPLICATION_STATUS[option.id] ?? {
            label: "Not started",
            tone: "idle" as const,
          };
          const category = supportCategoryMeta[option.category];
          const inPlan = supportIds.includes(option.id);
          return (
            <article key={option.id} className="desk-card desk-app">
              <div className="desk-app__main">
                <span className="desk-app__category">
                  <i
                    className="desk-app__dot"
                    style={{ background: category.color }}
                    aria-hidden="true"
                  />
                  {category.label}
                  {!inPlan && (
                    <span className="desk-app__off-plan">
                      · Not in your plan
                    </span>
                  )}
                </span>
                <h3 className="desk-action__title">{option.name}</h3>
                <p className="desk-card__text">{option.helpsWith}</p>
              </div>
              <div className="desk-app__meta">
                <span className="desk-app__amount">{option.amountLabel}</span>
                <span className="desk-app__timing">{option.timing}</span>
              </div>
              <div className="desk-app__side">
                <span className={`desk-app__status is-${status.tone}`}>
                  {status.label}
                </span>
                <button
                  type="button"
                  className="desk-card__more"
                  aria-label={`${option.name} application`}
                >
                  <ChevronRight size={14} strokeWidth={2.2} />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
