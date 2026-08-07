import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { PolicyCoverage, PolicyExclusion } from "../../types";
import type { DetailsOrigin } from "./RiskScoreDetails";
import heroImage from "../../assets/coverage-hero.png";
import "./CoverageDetails.css";

type Insurer = {
  name: string;
  policyNumber: string;
  renews: string;
};

type CoverageDetailsProps = {
  open: boolean;
  insurer: Insurer;
  coverages: PolicyCoverage[];
  exclusions: PolicyExclusion[];
  origin: DetailsOrigin | null;
  onClose: () => void;
};

const OPEN_DURATION = 300;

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function useIdToggle() {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const reset = () => setIds(new Set());
  return { has: (id: string) => ids.has(id), toggle, reset };
}

type GapCalloutProps = {
  detail: string;
  open: boolean;
  onToggle: () => void;
};

function GapCallout({ detail, open, onToggle }: GapCalloutProps) {
  return (
    <div className={`policy-gap${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="policy-gap__toggle"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="policy-gap__label">
          <AlertCircle size={20} strokeWidth={2} aria-hidden="true" />
          Coverage Gap Identified
        </span>
        <ChevronRight
          size={20}
          strokeWidth={2}
          aria-hidden="true"
          className="policy-gap__chevron"
        />
      </button>
      <div className="policy-reveal">
        <div className="policy-reveal__inner">
          <p className="policy-gap__detail">{detail}</p>
        </div>
      </div>
    </div>
  );
}

export function CoverageDetails({
  open,
  insurer,
  coverages,
  exclusions,
  origin,
  onClose,
}: CoverageDetailsProps) {
  const [mounted, setMounted] = useState(open);
  const [entered, setEntered] = useState(false);

  const collapsedCoverages = useIdToggle();
  const expandedExclusions = useIdToggle();
  const openGaps = useIdToggle();

  // Mount for the enter transition; keep mounted through the exit transition.
  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(raf);
    }
    setEntered(false);
    collapsedCoverages.reset();
    expandedExclusions.reset();
    openGaps.reset();
    const timer = window.setTimeout(() => setMounted(false), OPEN_DURATION);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  const target = document.getElementById("app-device") ?? document.body;

  return createPortal(
    <div
      className={`coverage-screen${entered ? " is-open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Coverage details"
      style={
        origin ? { transformOrigin: `${origin.x}px ${origin.y}px` } : undefined
      }
    >
      <button
        type="button"
        className="coverage-back"
        onClick={onClose}
        aria-label="Go back"
      >
        <ChevronLeft size={24} strokeWidth={2} aria-hidden="true" />
      </button>

      <div className="coverage-scroll">
        <header
          className="coverage-hero"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="coverage-hero__titles">
            <h1>{insurer.name}</h1>
            <p>
              Policy <span>{insurer.policyNumber}</span>
            </p>
          </div>
        </header>

        <p className="coverage-section-label">Your Coverage</p>

        <ul className="coverage-card-list">
          {coverages.map((coverage) => {
            const collapsed = collapsedCoverages.has(coverage.id);
            return (
              <li
                key={coverage.id}
                className={`policy-card${collapsed ? "" : " is-expanded"}`}
              >
                <button
                  type="button"
                  className="policy-card__header"
                  onClick={() => collapsedCoverages.toggle(coverage.id)}
                  aria-expanded={!collapsed}
                >
                  <span className="policy-card__titles">
                    <span className="policy-card__name">{coverage.name}</span>
                    <span className="policy-card__subtitle">
                      {coverage.subtitle}
                    </span>
                  </span>
                  <span className="policy-card__meta">
                    <span className="policy-card__amount">
                      {currency.format(coverage.limit)}
                    </span>
                    <ChevronDown
                      size={24}
                      strokeWidth={2}
                      aria-hidden="true"
                      className="policy-card__chevron"
                    />
                  </span>
                </button>

                <div className="policy-reveal">
                  <div className="policy-reveal__inner">
                    <div className="policy-card__body">
                      <p className="policy-card__description">
                        {coverage.description}
                      </p>
                      <div className="policy-example">
                        <span
                          className="policy-example__bar"
                          aria-hidden="true"
                        />
                        <div className="policy-example__copy">
                          <p className="policy-example__label">Example</p>
                          <p className="policy-example__text">
                            {coverage.example}
                          </p>
                        </div>
                      </div>
                      {coverage.gap && (
                        <GapCallout
                          detail={coverage.gap.detail}
                          open={openGaps.has(coverage.id)}
                          onToggle={() => openGaps.toggle(coverage.id)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="coverage-section-label">Not Included in Your Coverage</p>

        <ul className="coverage-card-list coverage-card-list--excluded">
          {exclusions.map((exclusion) => {
            const expanded = expandedExclusions.has(exclusion.id);
            return (
              <li
                key={exclusion.id}
                className={`policy-card${expanded ? " is-expanded" : ""}`}
              >
                <button
                  type="button"
                  className="policy-card__header"
                  onClick={() => expandedExclusions.toggle(exclusion.id)}
                  aria-expanded={expanded}
                >
                  <span className="policy-card__titles">
                    <span className="policy-card__name">{exclusion.name}</span>
                    <span className="policy-card__subtitle">
                      {exclusion.subtitle}
                    </span>
                  </span>
                  <span className="policy-card__meta">
                    <ChevronDown
                      size={24}
                      strokeWidth={2}
                      aria-hidden="true"
                      className="policy-card__chevron"
                    />
                  </span>
                </button>

                <div className="policy-reveal">
                  <div className="policy-reveal__inner">
                    <div className="policy-card__body">
                      <p className="policy-card__description">
                        {exclusion.description}
                      </p>
                      <div className="policy-example">
                        <span
                          className="policy-example__bar"
                          aria-hidden="true"
                        />
                        <div className="policy-example__copy">
                          <p className="policy-example__label">Example</p>
                          <p className="policy-example__text">
                            {exclusion.example}
                          </p>
                        </div>
                      </div>
                      {exclusion.riskNote && (
                        <div className="policy-risk-note">
                          <AlertCircle
                            size={20}
                            strokeWidth={2}
                            aria-hidden="true"
                          />
                          <p>{exclusion.riskNote}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>,
    target,
  );
}
