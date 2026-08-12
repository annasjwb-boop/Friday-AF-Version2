import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  DEFAULT_HOME_NAME,
  loadHomeName,
  saveHomeName,
} from "../../data/homeName";
import { AnimatePresence } from "framer-motion";
import {
  BatteryFull,
  Signal,
  Wifi,
} from "lucide-react";
import { riskScore } from "../../data/home";
import { currentReadiness } from "../../data/vaultSections";
import { METAPHOR_LABELS, METAPHORS, type MetaphorId } from "./metaphors";
import { getTurntableFrames } from "./turntableFrames";
import { CasitaHomePicker } from "./CasitaHomePicker";
import { CasitaRecovery } from "./CasitaRecovery";
import { CasitaDisaster } from "./CasitaDisaster";
import { DisasterHome } from "./DisasterHome";
import { CasitaDisasterPrompt } from "./CasitaDisasterPrompt";
import { CasitaHelp } from "./CasitaHelp";
import { CasitaOverview } from "./CasitaOverview";
import { CasitaReadiness } from "./CasitaReadiness";
import { CasitaRisk } from "./CasitaRisk";
import { PerilOverlay } from "./PerilOverlay";
import { PerilCaption, PerilSelector } from "./PerilSelector";
import type { PerilId } from "./perils";
import "./CasitaHome.css";

const ProductOrbit = lazy(() =>
  import("./ProductOrbit").then((m) => ({ default: m.ProductOrbit })),
);

const METAPHOR_STORAGE_KEY = "aidfinder:casita-metaphor";

function loadMetaphor(): MetaphorId {
  const param = new URLSearchParams(window.location.search).get("metaphor");
  if (METAPHORS.includes(param as MetaphorId)) return param as MetaphorId;
  const stored = localStorage.getItem(METAPHOR_STORAGE_KEY);
  if (METAPHORS.includes(stored as MetaphorId)) return stored as MetaphorId;
  return "sanctuary";
}

type TabId =
  | "overview"
  | "risk"
  | "readiness"
  | "recovery"
  /* Disaster mode replaces the three preparedness tabs with these. Overview
     stays in both modes — the house and its numbers matter more after a
     disaster, not less. */
  | "damage"
  | "plan"
  | "apply";

type TabStat = {
  label: string;
  value: string;
  note?: string;
  info?: boolean;
};

type TabConfig = {
  id: TabId;
  label: string;
  left: TabStat;
  right: TabStat & { pill: string; pillTone: "green" | "amber" | "teal" };
};

const TABS: TabConfig[] = [
  {
    id: "overview",
    label: "Overview",
    left: { label: "Home Estimate", value: "$664,400", info: true },
    right: {
      label: "Last 30-day change",
      value: "+$5,490",
      pill: "0.8%",
      pillTone: "green",
    },
  },
  {
    id: "risk",
    label: "Risk",
    left: {
      label: "Risk Score",
      value: String(riskScore.value),
      note: riskScore.label,
    },
    right: {
      label: "30-day change",
      value: `${riskScore.delta} pts`,
      pill: "1.4%",
      pillTone: "amber",
    },
  },
  {
    id: "readiness",
    label: "Readiness",
    left: { label: "Aid Readiness", value: `${currentReadiness().pct}%` },
    right: {
      label: "Tasks complete",
      value: "2 of 6",
      pill: "+1",
      pillTone: "green",
    },
  },
  {
    id: "recovery",
    label: "Recovery",
    left: { label: "Recovery Fund", value: "$18,200" },
    right: {
      label: "Plan funded",
      value: "45%",
      pill: "+5%",
      pillTone: "teal",
    },
  },
];


const ACTIVITY = [
  {
    id: "grant",
    name: "Applied for FEMA Housing Assistance grant",
    meta: "Submitted · Jul 24",
    status: "In Review",
  },
  {
    id: "deed",
    name: "Uploaded house deed",
    meta: "Documents · Jul 18",
    status: "Verified",
  },
  {
    id: "inspection",
    name: "Scheduled roof inspection",
    meta: "Peachtree Roofing · Jul 8",
    status: "Confirmed",
  },
];

export function CasitaHome() {
  const [metaphor, setMetaphor] = useState<MetaphorId>(loadMetaphor);
  const [pickerOpen, setPickerOpen] = useState(false);
  /* Disaster mode replaces the recovery tab's contents rather than routing
     elsewhere, so leaving it puts the person back where they were. */
  const [disasterMode, setDisasterMode] = useState(false);
  /* Lifted so the section below the stage can respond to the condition. */
  const [peril, setPeril] = useState<PerilId>("clear");
  /* Onboarding hands off with ?tab=risk or ?tab=readiness, so a flow can land
     the user on the view it just spent five minutes talking about. */
  /* The name is the person's, so it outlives the session. Kept in storage
     rather than state alone — renaming your home and finding it reverted on
     the next visit would read as the app not having listened. */
  const [title, setTitle] = useState(loadHomeName);
  const [savedTitle, setSavedTitle] = useState(title);
  const [editingTitle, setEditingTitle] = useState(false);

  const commitTitle = () => {
    const next = title.trim() || DEFAULT_HOME_NAME;
    setTitle(next);
    setSavedTitle(next);
    saveHomeName(next);
    setEditingTitle(false);
  };

  const [params] = useSearchParams();
  /* One tab strip, two sets. Nesting disaster's sections inside the recovery
     tab put two rows of tabs on screen at once. */
  const DISASTER_TABS: { id: TabId; label: string }[] = [
    { id: "overview", label: "Home" },
    { id: "damage", label: "Damage" },
    { id: "plan", label: "Recovery" },
    { id: "apply", label: "Apply" },
  ];

  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const t = params.get("tab");
    return TABS.some((x) => x.id === t) ? (t as TabId) : "overview";
  });

  /* Switching tabs keeps the scroller where it was, so arriving on a new tab
     could land mid-page — most visibly on the disaster tabs, which are entered
     from a prompt at the bottom of a scrolled Recovery view. */
  useEffect(() => {
    document
      .querySelector(".app-content")
      ?.scrollTo({ top: 0, behavior: "auto" });
  }, [activeTab, disasterMode]);

  const stageTap = useRef<{ x: number; y: number; t: number } | null>(null);

  const frames = getTurntableFrames(metaphor);

  const chooseMetaphor = (next: MetaphorId) => {
    setMetaphor(next);
    localStorage.setItem(METAPHOR_STORAGE_KEY, next);
    setPickerOpen(false);
  };

  return (
    <div className="casita">
      <header className="casita__top">
        <div className="casita__status" aria-hidden="true">
          <span className="casita__time">9:41</span>
          <span className="casita__status-icons">
            <Signal size={14} strokeWidth={2.2} />
            <Wifi size={14} strokeWidth={2.2} />
            <BatteryFull size={18} strokeWidth={1.8} />
          </span>
        </div>
        <div className="casita__bar">
          <div className="casita__identity">
            {editingTitle ? (
              <input
                className="casita__title casita__title--edit"
                value={title}
                autoFocus
                aria-label="Name for your home"
                maxLength={28}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitTitle();
                  if (e.key === "Escape") {
                    setTitle(savedTitle);
                    setEditingTitle(false);
                  }
                }}
              />
            ) : (
              <h1
                className="casita__title"
                tabIndex={0}
                role="button"
                aria-label={`${title} — tap to rename`}
                onClick={() => setEditingTitle(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setEditingTitle(true);
                  }
                }}
              >
                {title}
              </h1>
            )}
            <p className="casita__address">1200 Edwards Dr, Fort Myers, FL 33901</p>
          </div>
          <div className="casita__actions">
            {/* Help follows whichever tab is open, so the explainers and
                questions match what's on screen. */}
            {/* Disaster tabs keep their own identity for tips; the answer
                sheet has no content of its own for them, so it falls back to
                recovery inside CasitaHelp. */}
            <CasitaHelp context={activeTab} />
            <button type="button" className="casita__avatar" aria-label="Profile">
              <span aria-hidden="true">JB</span>
            </button>
          </div>
        </div>
      </header>

      <div
        className={`casita__sheet${disasterMode ? " casita__sheet--alert" : ""}`}
      >
        <nav className="casita__tabs" aria-label="Home views">
          {(disasterMode ? DISASTER_TABS : TABS).map((t) => (
            <button
              key={t.id}
              type="button"
              className={`casita__tab${t.id === activeTab ? " is-active" : ""}`}
              aria-pressed={t.id === activeTab}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {disasterMode && activeTab === "overview" ? (
          <DisasterHome onOpenDamage={() => setActiveTab("damage")} />
        ) : activeTab === "damage" ||
        activeTab === "plan" ||
        activeTab === "apply" ? (
          <CasitaDisaster
            section={activeTab}
            onSection={setActiveTab}
            onExit={() => {
              setDisasterMode(false);
              setActiveTab("overview");
            }}
          />
        ) : activeTab === "risk" ? (
          <CasitaRisk />
        ) : activeTab === "readiness" ? (
          <CasitaReadiness />
        ) : activeTab === "recovery" ? (
          <>
            <CasitaRecovery
              metaphor={metaphor}
              onHomeTap={() => setPickerOpen(true)}
            />
            {/* Sits over the recovery view rather than in it: the switch is a
                mode change, not another item on the plan. */}
            <CasitaDisasterPrompt
              onSwitch={() => {
                setDisasterMode(true);
                setActiveTab("damage");
              }}
            />
          </>
        ) : (
          <>
        <div
          className="casita__stage"
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
              frames={frames}
              alt={`Studio rendering of your ${METAPHOR_LABELS[metaphor]}. Tap to change your home.`}
            />
          </Suspense>

          <AnimatePresence initial={false}>
            {peril !== "clear" && <PerilOverlay key={peril} peril={peril} />}
          </AnimatePresence>

          <PerilSelector active={peril} onChange={setPeril} />
        </div>

        <PerilCaption active={peril} />

        <CasitaOverview peril={peril} onOpen={setActiveTab} />

        <section className="casita-charges">
          <header className="casita-charges__head">
            <h2 className="casita-charges__title">Recent Activity</h2>
            <button type="button" className="casita-charges__all">
              View All
            </button>
          </header>
          <ul className="casita-charges__list">
            {ACTIVITY.map((item) => (
              <li key={item.id} className="casita-charges__row">
                <div className="casita-charges__detail">
                  <span className="casita-charges__name">{item.name}</span>
                  <span className="casita-charges__meta">{item.meta}</span>
                </div>
                <span className="casita-charges__status">{item.status}</span>
              </li>
            ))}
          </ul>
        </section>
          </>
        )}

      </div>

      <AnimatePresence>
        {pickerOpen && (
          <CasitaHomePicker
            current={metaphor}
            onSelect={chooseMetaphor}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
