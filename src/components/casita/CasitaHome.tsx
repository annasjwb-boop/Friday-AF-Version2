import { lazy, Suspense, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  BatteryFull,
  Camera,
  CloudRainWind,
  Gauge,
  Info,
  Landmark,
  Signal,
  Wifi,
  X,
} from "lucide-react";
import { readinessProgress, riskScore } from "../../data/home";
import { METAPHOR_LABELS, METAPHORS, type MetaphorId } from "./metaphors";
import { getTurntableFrames } from "./turntableFrames";
import { CasitaHomePicker } from "./CasitaHomePicker";
import { CasitaRecovery } from "./CasitaRecovery";
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

type ActionCard = {
  id: string;
  icon: typeof Landmark;
  iconClass: string;
  title: string;
  body: string;
  cta: string;
};

const ACTIONS: ActionCard[] = [
  {
    id: "records",
    icon: Landmark,
    iconClass: "is-slate",
    title: "Connect your state records",
    body: "Link Georgia property records to pre-fill grant and aid applications automatically.",
    cta: "Connect",
  },
  {
    id: "risk",
    icon: Gauge,
    iconClass: "is-amber",
    title: "Improve your risk score",
    body: "Gutter guards, smoke sensors, and a sump check could add 12 points.",
    cta: "View Fixes",
  },
  {
    id: "photos",
    icon: Camera,
    iconClass: "is-blue",
    title: "Upload images of your home",
    body: "Current room-by-room photos speed up claims and strengthen aid applications.",
    cta: "Upload Photos",
  },
  {
    id: "alerts",
    icon: CloudRainWind,
    iconClass: "is-teal",
    title: "Turn on storm alerts",
    body: "Get notified 48 hours before severe weather is expected near your address.",
    cta: "Enable Alerts",
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
  const [actionIds, setActionIds] = useState(() => ACTIONS.map((a) => a.id));
  const stageTap = useRef<{ x: number; y: number; t: number } | null>(null);

  const tab = TABS.find((t) => t.id === activeTab) ?? TABS[0];
  const orderedActions = actionIds
    .map((id) => ACTIONS.find((a) => a.id === id))
    .filter((a): a is ActionCard => Boolean(a));
  const frames = getTurntableFrames(metaphor);

  const cycleAction = () =>
    setActionIds(([first, ...rest]) => [...rest, first]);

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
          <button type="button" className="casita__avatar" aria-label="Profile">
            <span aria-hidden="true">JB</span>
          </button>
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

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab.id}
            className="casita__stats"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="casita__stat">
              <span className="casita__stat-label">{tab.left.label}</span>
              <span className="casita__stat-value">
                {tab.left.value}
                {tab.left.note && (
                  <span className="casita__stat-note">{tab.left.note}</span>
                )}
                {tab.left.info && (
                  <Info
                    size={13}
                    strokeWidth={2}
                    className="casita__stat-info"
                    aria-label="How this estimate is calculated"
                  />
                )}
              </span>
            </div>
            <div className="casita__stat casita__stat--right">
              <span className="casita__stat-label">{tab.right.label}</span>
              <span className="casita__stat-value">
                {tab.right.value}
                <span
                  className={`casita__pill casita__pill--${tab.right.pillTone}`}
                >
                  {tab.right.pill}
                </span>
              </span>
            </div>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {orderedActions.length > 0 && (
            <motion.section
              className="casita-stack"
              aria-label="Suggested actions"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="casita-stack__viewport">
                <AnimatePresence>
                  {orderedActions
                    .slice(0, 3)
                    .reverse()
                    .map((action, idx, arr) => {
                      const i = arr.length - 1 - idx;
                      const isTop = i === 0;
                      const ActionIcon = action.icon;
                      return (
                        <motion.article
                          key={action.id}
                          className="casita-stack__card"
                          initial={{
                            y: (i + 1) * 11,
                            scale: 1 - (i + 1) * 0.045,
                            opacity: 0,
                          }}
                          animate={{
                            y: i * 11,
                            scale: 1 - i * 0.045,
                            opacity: 1,
                          }}
                          exit={{
                            x: 340,
                            rotate: 5,
                            opacity: 0,
                            transition: {
                              duration: 0.28,
                              ease: [0.32, 0.72, 0, 1],
                            },
                          }}
                          transition={{
                            duration: 0.3,
                            ease: [0.32, 0.72, 0, 1],
                          }}
                          drag={isTop ? "x" : false}
                          dragConstraints={{ left: 0, right: 0 }}
                          dragElastic={0.7}
                          onDragEnd={(_, info) => {
                            if (
                              Math.abs(info.offset.x) > 90 ||
                              Math.abs(info.velocity.x) > 600
                            ) {
                              cycleAction();
                            }
                          }}
                        >
                          <button
                            type="button"
                            className="casita-stack__close"
                            aria-label="Next suggestion"
                            tabIndex={isTop ? 0 : -1}
                            onClick={cycleAction}
                          >
                            <X size={14} strokeWidth={2.2} />
                          </button>
                          <div className="casita-stack__head">
                            <span
                              className={`casita-stack__icon ${action.iconClass}`}
                            >
                              <ActionIcon size={16} strokeWidth={2} />
                            </span>
                            <p className="casita-stack__title">
                              {action.title}
                            </p>
                          </div>
                          <p className="casita-stack__text">{action.body}</p>
                          <div className="casita-stack__foot">
                            <button
                              type="button"
                              className="casita-stack__cta"
                              tabIndex={isTop ? 0 : -1}
                            >
                              {action.cta}
                            </button>
                            {isTop && (
                              <span className="casita-stack__count">
                                {ACTIONS.findIndex(
                                  (a) => a.id === action.id,
                                ) + 1}
                                /{ACTIONS.length}
                              </span>
                            )}
                          </div>
                        </motion.article>
                      );
                    })}
                </AnimatePresence>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

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
