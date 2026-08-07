import { lazy, Suspense, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  Gauge,
  Home,
  LifeBuoy,
  Link2,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import type { DetailsOrigin } from "../home/RiskScoreDetails";
import type { CostView, CostViewId } from "../../types";
import type { SanctuaryProfile } from "../../types/sanctuary";
import {
  assetLibrary,
  assetLibraryTotals,
  costViews,
  readinessSections,
} from "../../data/finance";
import { formatMoney } from "../../data/recovery";
import { sanctuaryStory } from "../sanctuary-b/profile";
import { sanctuaryProfile } from "../../data/sanctuary-profile";
import { DEFAULT_LOOK, type SanctuaryLook } from "../sanctuary-b/look";
import { type HomeDims } from "./HomeExplore";
import { Folder, type FolderSkin } from "./Folder";
import { RiskScreen } from "./RiskScreen";
import "./SanctuaryProduct.css";

// The 3D stack is heavy; Home + Explore load on demand.
const HomeStage = lazy(() =>
  import("./HomeStage").then((m) => ({ default: m.HomeStage })),
);
const HomeExplore = lazy(() =>
  import("./HomeExplore").then((m) => ({ default: m.HomeExplore })),
);

/* ---------------------------------------------------------------------------
 * Shared condition — the twelve readiness essentials drive Home, the
 * Readiness screen, and the summary language.
 * ------------------------------------------------------------------------- */

type Essential = {
  id: string;
  name: string;
  section: string;
  minutes: number;
};

const ESSENTIALS: Essential[] = readinessSections.flatMap((section) =>
  section.items.map((item) => ({
    id: item.id,
    name: item.name,
    section: section.name,
    minutes: 2,
  })),
);

const INITIAL_DONE = readinessSections.flatMap((section) =>
  section.items.filter((item) => item.done).map((item) => item.id),
);

const TOTAL_VIEW = costViews[0];
const FUNDED = TOTAL_VIEW.sources.reduce((sum, s) => sum + s.amount, 0);
const COVERED_PCT = Math.round((FUNDED / TOTAL_VIEW.total) * 100); // 92%

type TabId = "home" | "risk" | "readiness" | "recovery";

const TABS: { id: TabId; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "risk", label: "Risk", icon: Gauge },
  { id: "readiness", label: "Readiness", icon: FileCheck2 },
  { id: "recovery", label: "Recovery", icon: LifeBuoy },
];

export function SanctuaryProduct({
  onOpenRisk,
}: {
  onOpenRisk: (origin: DetailsOrigin | null) => void;
}) {
  const [tab, setTab] = useState<TabId>("home");
  const [doneIds, setDoneIds] = useState<string[]>(INITIAL_DONE);
  // Creative look (color, brightness, model) persists across Home ↔ Explore.
  // Number sandboxes never leave Explore — closing always returns to truth.
  const [look, setLook] = useState<SanctuaryLook>(DEFAULT_LOOK);
  const [exploring, setExploring] = useState(false);

  const done = doneIds.length;
  const total = ESSENTIALS.length;
  const readinessPct = Math.min(Math.ceil((done / total) * 100), 100);
  const nextEssential =
    ESSENTIALS.find((item) => !doneIds.includes(item.id)) ?? null;

  const truth: HomeDims = {
    risk: 56,
    readiness: readinessPct,
    coverage: 71,
    recovery: 92,
  };

  const completeNext = () => {
    if (nextEssential) setDoneIds((ids) => [...ids, nextEssential.id]);
  };

  const completeItems = (itemIds: string[]) => {
    setDoneIds((ids) => [
      ...ids,
      ...itemIds.filter((id) => !ids.includes(id)),
    ]);
  };

  // Full-page explore tool takes over the product — no tab bar, no home
  // chrome. Sandbox state lives only inside HomeExplore and dies on exit.
  if (exploring) {
    return (
      <div className="gd gd--tool">
        <Suspense
          fallback={
            <div className="gd-home__fallback" style={{ position: "relative" }}>
              Loading…
            </div>
          }
        >
          <HomeExplore
            truth={truth}
            look={look}
            onLookChange={setLook}
            doneCount={done}
            onClose={() => setExploring(false)}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="gd">
      <div className="gd-view" key={tab}>
        {tab === "home" && (
          <HomeTab
            truth={truth}
            look={look}
            onLookChange={setLook}
            done={done}
            total={total}
            onGoTo={setTab}
            onOpenExplore={() => setExploring(true)}
          />
        )}
        {tab === "risk" && <RiskScreen onOpenRisk={onOpenRisk} />}
        {tab === "readiness" && (
          <ReadinessTab
            done={done}
            total={total}
            readinessPct={readinessPct}
            doneIds={doneIds}
            nextEssential={nextEssential}
            onCompleteNext={completeNext}
            onCompleteItems={completeItems}
          />
        )}
        {tab === "recovery" && <RecoveryTab />}
      </div>

      {/* Frosted floating pill navigation. */}
      <div className="gd-navdock">
        <nav className="gd-nav" aria-label="Main">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`gd-nav__item${id === tab ? " is-active" : ""}`}
              aria-current={id === tab ? "page" : undefined}
              aria-label={label}
              onClick={() => setTab(id)}
            >
              <Icon size={19} strokeWidth={2.2} aria-hidden="true" />
              <span className="gd-nav__label">{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Home — the sanctuary
 * ------------------------------------------------------------------------- */

function HomeTab({
  truth,
  look,
  onLookChange,
  done,
  total,
  onGoTo,
  onOpenExplore,
}: {
  truth: HomeDims;
  look: SanctuaryLook;
  onLookChange: (look: SanctuaryLook) => void;
  done: number;
  total: number;
  onGoTo: (tab: TabId) => void;
  onOpenExplore: () => void;
}) {
  const [pageIndex, setPageIndex] = useState(0);

  // Home always renders what is true — never a leftover sandbox tweak.
  const profile: SanctuaryProfile = useMemo(
    () => ({
      ...sanctuaryProfile,
      hazard: "flood",
      risk: truth.risk,
      readiness: truth.readiness,
      coverage: truth.coverage,
      // Scaled so the sample 71% coverage keeps its ~$185k rebuild gap.
      coverageGapUsd: Math.round((100 - truth.coverage) * 6400),
      recovery: truth.recovery,
    }),
    [truth.risk, truth.readiness, truth.coverage, truth.recovery],
  );

  const story = useMemo(() => sanctuaryStory(profile), [profile]);
  const actionTab: TabId =
    story.finalAction.tab === "preparedness"
      ? "readiness"
      : story.finalAction.tab;

  // Narrative chapters: the overall reading first, then each scene of the
  // story — environment, structure, boundary — spotlighting its region of
  // the model as it comes up.
  const pages = useMemo(
    () => [
      {
        id: "overview",
        anchor: null as string | null,
        headline: story.headline,
        body: story.body,
      },
      ...story.scenes.map((scene) => ({
        id: scene.id,
        anchor: scene.anchor as string | null,
        headline: scene.headline,
        body: scene.body,
      })),
    ],
    [story],
  );
  const page = pages[pageIndex % pages.length];

  return (
    <div className="gd-home">
      <p className="gd-label">
        <Sparkles size={16} strokeWidth={2.2} aria-hidden="true" />
        1204 Bayshore Lane
      </p>
      <h1 className="gd-home__greeting">
        Good morning.
        <br />
        <span>Here&rsquo;s your sanctuary.</span>
      </h1>

      {/* The sanctuary stands directly on the blue field — no card. */}
      <div className="gd-home__stage">
        <Suspense
          fallback={<span className="gd-home__fallback">Loading…</span>}
        >
          <HomeStage
            profile={profile}
            look={look}
            onLookChange={onLookChange}
            highlightAnchor={page.anchor}
            doneCount={done}
            onOpenExplore={onOpenExplore}
          />
        </Suspense>
      </div>

      <div className="gd-home__story">
        {/* Keyed so each chapter runs the entrance animation. */}
        <div className="gd-home__story-page" key={page.id}>
          <h2 className="gd-home__story-headline">{page.headline}</h2>
          <p className="gd-home__story-body">{page.body}</p>
        </div>

        <div className="gd-home__story-nav">
          <div
            className="gd-home__story-dots"
            role="tablist"
            aria-label="Story chapters"
          >
            {pages.map((p, i) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={i === pageIndex}
                aria-label={`Chapter ${i + 1} of ${pages.length}`}
                className={`gd-home__story-dot${i === pageIndex ? " is-active" : ""}`}
                onClick={() => setPageIndex(i)}
              />
            ))}
          </div>
          <div className="gd-home__story-arrows">
            <button
              type="button"
              className="gd-home__story-arrow"
              aria-label="Previous chapter"
              onClick={() =>
                setPageIndex((pageIndex + pages.length - 1) % pages.length)
              }
            >
              <ChevronLeft size={17} strokeWidth={2.2} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="gd-home__story-arrow"
              aria-label="Next chapter"
              onClick={() => setPageIndex((pageIndex + 1) % pages.length)}
            >
              <ChevronRight size={17} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>
        </div>

        <button
          type="button"
          className="gd-pill"
          onClick={() => onGoTo(actionTab)}
        >
          {story.finalAction.label}
          <ArrowUpRight size={15} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>

      <hr className="gd-dotted" />
      <div className="gd-home__foot">
        <span>
          <strong>
            {done} of {total}
          </strong>{" "}
          essentials ready
        </span>
        <span>
          <strong>{COVERED_PCT}%</strong> recovery funded
        </span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Readiness — folders for everything the user documents and connects
 * ------------------------------------------------------------------------- */

/** Folder skins and short names per section. Skins carry meaning:
 *  blue folders hold documents, dark folders hold photos. */
const FOLDER_META: Record<string, { skin: FolderSkin; short: string }> = {
  identity: { skin: "blue", short: "Identity" },
  property: { skin: "blue", short: "Property" },
  insurance: { skin: "blue", short: "Insurance" },
  vehicles: { skin: "blue", short: "Vehicles" },
  access: { skin: "dark", short: "Home access" },
};

/** The grid is organized by what goes in the folder: paperwork first,
 *  then photo evidence. Belongings renders with the photo group. */
const FOLDER_GROUPS: { id: string; label: string; sectionIds: string[] }[] = [
  {
    id: "documents",
    label: "Documents",
    sectionIds: ["identity", "property", "insurance", "vehicles"],
  },
  { id: "photos", label: "Photos", sectionIds: ["access"] },
];

const BELONGINGS_TOTALS = assetLibraryTotals(assetLibrary);

function ReadinessTab({
  done,
  total,
  readinessPct,
  doneIds,
  nextEssential,
  onCompleteNext,
  onCompleteItems,
}: {
  done: number;
  total: number;
  readinessPct: number;
  doneIds: string[];
  nextEssential: Essential | null;
  onCompleteNext: () => void;
  onCompleteItems: (itemIds: string[]) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openSection =
    readinessSections.find((section) => section.id === openId) ?? null;

  return (
    <div className="gd-ready">
      <p className="gd-label">
        <FileCheck2 size={16} strokeWidth={2.2} aria-hidden="true" />
        Aid readiness
      </p>

      <div className="gd-ready__figure">
        {done}
        <span className="gd-ready__of">/ {total}</span>
      </div>
      <p className="gd-ready__sub">
        <span className="gd-chip gd-chip--yellow">{readinessPct}% ready</span>
        essentials on file to apply for aid
      </p>

      {/* One folder per record, grouped by what goes inside — blue folders
          hold documents, dark folders hold photos. */}
      {FOLDER_GROUPS.map((group) => (
        <section key={group.id} className="gd-foldergroup">
          <h2 className="gd-foldergroup__title">{group.label}</h2>
          <ul className="gd-folders">
            {group.sectionIds.map((sectionId) => {
              const section = readinessSections.find(
                (s) => s.id === sectionId,
              )!;
              const meta = FOLDER_META[section.id];
              const sectionDone = section.items.filter((item) =>
                doneIds.includes(item.id),
              ).length;
              return (
                <li key={section.id}>
                  <button
                    type="button"
                    className="gd-folder"
                    onClick={() => setOpenId(section.id)}
                  >
                    <Folder skin={meta.skin} />
                    <span className="gd-folder__info">
                      <span className="gd-folder__name">{meta.short}</span>
                      <span className="gd-folder__count">
                        {sectionDone} of {section.items.length} on file
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
            {group.id === "photos" && (
              <li>
                <button
                  type="button"
                  className="gd-folder"
                  onClick={() => setOpenId("belongings")}
                >
                  <Folder skin="dark" />
                  <span className="gd-folder__info">
                    <span className="gd-folder__name">Belongings</span>
                    <span className="gd-folder__count">
                      {BELONGINGS_TOTALS.items} items documented
                    </span>
                  </span>
                </button>
              </li>
            )}
          </ul>
        </section>
      ))}

      {nextEssential ? (
        <div className="gd-ready__next">
          <button type="button" className="gd-pill" onClick={onCompleteNext}>
            Add {nextEssential.name.toLowerCase()}
            <span className="gd-pill__time">
              {nextEssential.minutes} min
            </span>
          </button>
        </div>
      ) : (
        <p className="gd-ready__complete">
          Every essential is on file — you&rsquo;re ready to apply.
        </p>
      )}

      {nextEssential && (
        <>
          <hr className="gd-dotted" />
          <div className="gd-ready__foot">
            <span>
              <strong>{total - done}</strong> essentials to go
            </span>
            <span>
              about <strong>{(total - done) * 2} min</strong> of work
            </span>
          </div>
        </>
      )}

      {openSection && (
        <FolderSheet
          title={FOLDER_META[openSection.id].short}
          subtitle={openSection.meta}
          onClose={() => setOpenId(null)}
        >
          <ul className="gd-fsheet__rows">
            {openSection.items.map((item) => {
              const isDone = doneIds.includes(item.id);
              return (
                <li key={item.id} className="gd-fsheet__row">
                  <span
                    className={`gd-fsheet__mark${isDone ? " is-done" : ""}`}
                    aria-hidden="true"
                  >
                    {isDone && <Check size={13} strokeWidth={3} />}
                  </span>
                  <span className="gd-fsheet__name">{item.name}</span>
                  {!isDone && (
                    <button
                      type="button"
                      className="gd-pill gd-pill--small"
                      onClick={() => onCompleteItems([item.id])}
                    >
                      Add
                      <span className="gd-pill__time">2 min</span>
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          {openSection.id === "insurance" && (
            <button
              type="button"
              className="gd-fsheet__connect"
              onClick={() =>
                onCompleteItems(openSection.items.map((item) => item.id))
              }
            >
              <Link2 size={16} strokeWidth={2.2} aria-hidden="true" />
              Connect USAA — import your policy documents
            </button>
          )}
        </FolderSheet>
      )}

      {openId === "belongings" && (
        <FolderSheet
          title="Belongings"
          subtitle="Pre-fills claims and aid applications"
          onClose={() => setOpenId(null)}
        >
          <ul className="gd-fsheet__rows">
            {assetLibrary.map((category) => {
              const value = category.items.reduce(
                (sum, item) => sum + item.value,
                0,
              );
              return (
                <li key={category.id} className="gd-fsheet__row">
                  <span className="gd-fsheet__name">
                    {category.label}
                    <small>{category.items.length} items</small>
                  </span>
                  <span className="gd-fsheet__value">
                    {formatMoney(value)}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="gd-fsheet__note">
            {formatMoney(BELONGINGS_TOTALS.value)} documented — you tell your
            story once, and it fills every application.
          </p>
        </FolderSheet>
      )}
    </div>
  );
}

/** Bottom sheet that opens from a folder tile. */
function FolderSheet({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: ReactNode;
}) {
  // Portaled into the device viewport so the sheet stays inside the phone
  // frame and still stacks above the floating nav.
  const target =
    document.getElementById("app-viewport") ?? document.body;

  return createPortal(
    <div className="gd-folderlay" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        className="gd-folderlay__scrim"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="gd-fsheet">
        <div className="gd-fsheet__head">
          <div>
            <h2 className="gd-fsheet__title">{title}</h2>
            <p className="gd-fsheet__subtitle">{subtitle}</p>
          </div>
          <button
            type="button"
            className="gd-fsheet__close"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={17} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    target,
  );
}

/* ---------------------------------------------------------------------------
 * Recovery — linked funding capsules
 * ------------------------------------------------------------------------- */

const CAP_COLORS: Record<string, string> = {
  insurance: "#ffffff",
  sba: "#a6edfb",
  fema: "#edff3d",
  personal: "#f9cfe0",
};

const TICK_COUNT = 56;

/** Short chip labels for the three recovery lenses. */
const VIEW_CHIP: Record<CostViewId, string> = {
  total: "Total recovery",
  rebuild: "Home",
  property: "Property",
};

const VIEW_ORDER: CostViewId[] = ["total", "rebuild", "property"];

/** Slim tick meter (reference style): thin vertical ticks across the
 *  full width, each colored by the funding source covering that slice
 *  of the total; the unfunded tail reads as faint ticks. */
function TickMeter({
  view,
  ...props
}: { view: CostView } & { "aria-hidden"?: boolean }) {
  const stops: { at: number; color: string }[] = [];
  let cum = 0;
  for (const source of view.sources) {
    cum += source.amount / view.total;
    stops.push({ at: cum, color: CAP_COLORS[source.id] });
  }

  return (
    <div className="gd-recover__meter" {...props}>
      {Array.from({ length: TICK_COUNT }, (_, i) => {
        const t = (i + 0.5) / TICK_COUNT;
        const stop = stops.find((s) => t <= s.at);
        return (
          <span
            key={i}
            className={`gd-recover__tick${stop ? "" : " is-gap"}`}
            style={stop ? { background: stop.color } : undefined}
          />
        );
      })}
    </div>
  );
}

function RecoveryTab() {
  const navigate = useNavigate();
  const [viewId, setViewId] = useState<CostViewId>("total");
  const view = costViews.find((v) => v.id === viewId) ?? costViews[0];
  const funded = view.sources.reduce((sum, s) => sum + s.amount, 0);
  const gap = Math.max(view.total - funded, 0);
  const coveredPct = Math.round((funded / view.total) * 100);

  const cycleView = () => {
    const i = VIEW_ORDER.indexOf(viewId);
    setViewId(VIEW_ORDER[(i + 1) % VIEW_ORDER.length]);
  };

  return (
    <>
      <div className="gd-recover__top">
        <div className="gd-recover__head">
          <p className="gd-label">
            <LifeBuoy size={16} strokeWidth={2.2} aria-hidden="true" />
            Recovery plan
          </p>
          <button
            type="button"
            className="gd-chip gd-chip--glass gd-recover__cycle"
            onClick={cycleView}
            aria-label={`Cost view: ${VIEW_CHIP[viewId]}. Tap to cycle.`}
          >
            {VIEW_CHIP[viewId]}
            <ChevronRight size={13} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </div>

        <div className="gd-recover__hero" key={viewId}>
          <div className="gd-recover__figure">{formatMoney(gap)}</div>
          <p className="gd-recover__sub">
            Remaining gap · of <strong>{formatMoney(view.total)}</strong>{" "}
            {view.tab.toLowerCase()}
          </p>
          <span className="gd-chip gd-chip--yellow gd-recover__funded">
            {coveredPct}% funded
          </span>
        </div>

        <TickMeter view={view} aria-hidden />

        <div className="gd-recover__ends" aria-hidden="true">
          <span>Funded</span>
          <span>Gap</span>
        </div>
        <hr className="gd-dotted" style={{ marginBottom: 26 }} />
      </div>

      {/* The funding ledger stays on the blue field, reference style —
          no white sheet. */}
      <div className="gd-recover__ledger">
        <ul className="gd-recover__rows">
          {view.sources.map((source) => (
            <li key={source.id}>
              <div className="gd-recover__row">
                <span
                  className="gd-recover__dot"
                  style={{ background: CAP_COLORS[source.id] }}
                  aria-hidden="true"
                />
                <span className="gd-recover__name">
                  {source.name.split("·")[0].trim()}
                </span>
                <span className="gd-recover__amount">
                  {formatMoney(source.amount)}
                </span>
              </div>
            </li>
          ))}
          <li>
            <div className="gd-recover__row gd-recover__row--gap">
              <span
                className="gd-recover__dot"
                style={{ border: "2px dashed var(--gd-yellow)" }}
                aria-hidden="true"
              />
              <span className="gd-recover__name">Remaining gap</span>
              <span className="gd-recover__amount">{formatMoney(gap)}</span>
            </div>
          </li>
        </ul>

        <div className="gd-recover__foot">
          <span className="gd-stat__label">
            <ShieldAlert
              size={14}
              strokeWidth={2.2}
              aria-hidden="true"
              style={{ verticalAlign: -2, marginRight: 5 }}
            />
            Flood coverage would close most of it
          </span>
          <button
            type="button"
            className="gd-pill gd-pill--white"
            onClick={() => navigate("/recovery/support")}
          >
            Close the gap
            <ArrowUpRight size={15} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>
      </div>
    </>
  );
}
