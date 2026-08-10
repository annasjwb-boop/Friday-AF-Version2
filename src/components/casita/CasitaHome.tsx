import { lazy, Suspense, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import {
  BatteryFull,
  Signal,
  Wifi,
} from "lucide-react";
import { readinessProgress, riskScore } from "../../data/home";
import { METAPHOR_LABELS, METAPHORS, type MetaphorId } from "./metaphors";
import { getTurntableFrames } from "./turntableFrames";
import { CasitaHomePicker } from "./CasitaHomePicker";
import { CasitaRecovery } from "./CasitaRecovery";
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

type TabId = "overview" | "risk" | "readiness" | "recovery";

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
    label: "Risk Score",
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
    left: { label: "Aid Readiness", value: `${readinessProgress}%` },
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
  /* Lifted so the section below the stage can respond to the condition. */
  const [peril, setPeril] = useState<PerilId>("clear");
  /* Onboarding hands off with ?tab=risk or ?tab=readiness, so a flow can land
     the user on the view it just spent five minutes talking about. */
  const [params] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const t = params.get("tab");
    return TABS.some((x) => x.id === t) ? (t as TabId) : "overview";
  });
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
            <h1 className="casita__title">Casita</h1>
            <p className="casita__address">123 Prado Rd NE, Atlanta, GA</p>
          </div>
          <div className="casita__actions">
            {/* Help follows whichever tab is open, so the explainers and
                questions match what's on screen. */}
            <CasitaHelp context={activeTab} />
            <button type="button" className="casita__avatar" aria-label="Profile">
              <span aria-hidden="true">JB</span>
            </button>
          </div>
        </div>
      </header>

      <div className="casita__sheet">
        <nav className="casita__tabs" aria-label="Home views">
          {TABS.map((t) => (
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

        {activeTab === "risk" ? (
          <CasitaRisk />
        ) : activeTab === "readiness" ? (
          <CasitaReadiness />
        ) : activeTab === "recovery" ? (
          <CasitaRecovery
            metaphor={metaphor}
            onHomeTap={() => setPickerOpen(true)}
          />
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
