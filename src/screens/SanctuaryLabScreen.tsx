import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import type { HazardType, SanctuaryId } from "../types/sanctuary";
import { SANCTUARIES, getSanctuary } from "../data/sanctuaries-b";
import { PALETTE, type StateParams } from "../components/sanctuary-b/models/state";
import { SanctuaryScene } from "../components/sanctuary-b/SanctuaryScene";
import { ThemePicker } from "../components/sanctuary-b/ThemePicker";
import { getSanctuaryTheme } from "../components/sanctuary-b/themes";
import { useBackground } from "../app/background";
import "./SanctuaryLabScreen.css";

interface LabState {
  model: SanctuaryId;
  // Environment (risk)
  hazard: HazardType;
  threat: number; // 0..1
  light: number; // 0.3..1.2
  embers: boolean;
  emberLight: boolean;
  fogTint: boolean;
  // Structure (readiness)
  tier: 0 | 1 | 2 | 3;
  wear: number; // 0..1
  glow: number; // 0..2
  // Boundary (coverage)
  boundaryOn: boolean;
  covered: number; // 0..1
  // Pathway (recovery)
  pathwayOn: boolean;
  pathway: number; // 0..1
  // Lifecycle
  damaged: boolean;
  recovering: boolean;
  unknownFog: number; // 0..1
}

/** Roughly the sample profile: high wildfire risk, developing readiness. */
const DEFAULTS: LabState = {
  model: "castle",
  hazard: "wildfire",
  threat: 0.82,
  light: 0.6,
  embers: true,
  emberLight: true,
  fogTint: true,
  tier: 1,
  wear: 0.41,
  glow: 1.35,
  boundaryOn: true,
  covered: 0.71,
  pathwayOn: true,
  pathway: 0.76,
  damaged: false,
  recovering: false,
  unknownFog: 0,
};

const HAZARDS: { value: HazardType; label: string }[] = [
  { value: "wildfire", label: "Wildfire" },
  { value: "flood", label: "Flood" },
  { value: "wind", label: "Wind" },
  { value: "quake", label: "Quake" },
  { value: "winter", label: "Winter" },
];

const TIERS: { value: 0 | 1 | 2 | 3; label: string }[] = [
  { value: 0, label: "Half-built" },
  { value: 1, label: "Modest" },
  { value: 2, label: "Archetype" },
  { value: 3, label: "Fortified" },
];

function SliderRow({
  label,
  value,
  min = 0,
  max = 1,
  step = 0.01,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="lab-row">
      <span className="lab-row__label">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="lab-row__value">
        {format ? format(value) : Math.round(value * 100)}
      </span>
    </label>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="lab-row">
      <span className="lab-row__label">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        className={`lab-switch${value ? " is-on" : ""}`}
        onClick={() => onChange(!value)}
      >
        <span className="lab-switch__thumb" />
      </button>
    </div>
  );
}

/**
 * SANCTUARY LAB — a workbench for the 4.b scene. Every knob that drives the
 * 3D model is exposed directly: the four channel dials, the readiness tier,
 * and independent on/off switches for each individual effect (distant
 * smoke, embers, ember glow, fog tint, shield, route) so any one execution
 * can be judged in isolation. Nothing here is derived from a profile — the
 * controls build the scene params raw.
 */
export function SanctuaryLabScreen() {
  const [lab, setLab] = useState<LabState>(DEFAULTS);
  const reducedMotion = useReducedMotion() ?? false;
  const sanctuary = getSanctuary(lab.model);
  const { sanctuaryTheme } = useBackground();
  const theme = getSanctuaryTheme(sanctuaryTheme);

  const set = <K extends keyof LabState>(key: K, value: LabState[K]) =>
    setLab((s) => ({ ...s, [key]: value }));

  const params = useMemo<StateParams>(
    () => ({
      state: lab.damaged ? "damaged" : "healthy",
      light: lab.light,
      glow: lab.damaged ? 0.1 : lab.glow,
      accent: lab.threat > 0.6 ? PALETTE.ember : theme.accent,
      wear: lab.damaged ? 1 : lab.wear,
      threat: lab.threat,
      hazard: lab.hazard,
      damaged: lab.damaged,
      recovering: lab.recovering,
      tier: lab.tier,
      personalized: true,
      boundary: lab.boundaryOn ? lab.covered : null,
      pathway: lab.pathwayOn ? lab.pathway : null,
      unknownFog: lab.unknownFog,
      unknown: {
        risk: false,
        readiness: false,
        coverage: false,
        recovery: false,
      },
      features: {
        embers: lab.embers,
        emberLight: lab.emberLight,
        fogTint: lab.fogTint,
      },
    }),
    [lab, theme],
  );

  return (
    <div
      className={[
        "sanctuary-lab",
        theme.ink === "light" ? "sanctuary-lab--ink-light" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <header className="sanctuary-lab__header">
        <Link to="/" className="sanctuary-lab__back" aria-label="Back to home">
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <h1 className="sanctuary-lab__title">Sanctuary Lab</h1>
        <button
          type="button"
          className="sanctuary-lab__reset"
          aria-label="Reset controls"
          onClick={() => setLab({ ...DEFAULTS, model: lab.model })}
        >
          <RotateCcw size={16} aria-hidden="true" />
        </button>
      </header>

      <div className="sanctuary-lab__stage">
        <SanctuaryScene
          sanctuary={sanctuary}
          params={params}
          theme={theme}
          sceneKey={`${lab.model}:${lab.damaged ? "damaged" : "lab"}`}
          reducedMotion={reducedMotion}
        />
      </div>

      <div className="sanctuary-lab__controls">
        <section className="lab-section">
          <h2 className="lab-section__title">Model</h2>
          <div className="lab-chips">
            {SANCTUARIES.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`lab-chip${s.id === lab.model ? " is-active" : ""}`}
                aria-pressed={s.id === lab.model}
                onClick={() => set("model", s.id)}
              >
                {s.name.replace("The ", "")}
              </button>
            ))}
          </div>
        </section>

        <section className="lab-section">
          <h2 className="lab-section__title">Theme</h2>
          <ThemePicker />
        </section>

        <section className="lab-section">
          <h2 className="lab-section__title">Environment · Risk</h2>
          <div className="lab-chips">
            {HAZARDS.map((h) => (
              <button
                key={h.value}
                type="button"
                className={`lab-chip${h.value === lab.hazard ? " is-active" : ""}`}
                aria-pressed={h.value === lab.hazard}
                onClick={() => set("hazard", h.value)}
              >
                {h.label}
              </button>
            ))}
          </div>
          <SliderRow label="Threat" value={lab.threat} onChange={(v) => set("threat", v)} />
          <SliderRow
            label="Scene light"
            value={lab.light}
            min={0.3}
            max={1.2}
            onChange={(v) => set("light", v)}
          />
          {lab.hazard === "wildfire" && (
            <>
              <ToggleRow label="Embers" value={lab.embers} onChange={(v) => set("embers", v)} />
              <ToggleRow label="Ember glow (light)" value={lab.emberLight} onChange={(v) => set("emberLight", v)} />
            </>
          )}
          <ToggleRow label="Hazard fog tint" value={lab.fogTint} onChange={(v) => set("fogTint", v)} />
        </section>

        <section className="lab-section">
          <h2 className="lab-section__title">Structure · Readiness</h2>
          <div className="lab-chips">
            {TIERS.map((t) => (
              <button
                key={t.value}
                type="button"
                className={`lab-chip${t.value === lab.tier ? " is-active" : ""}`}
                aria-pressed={t.value === lab.tier}
                onClick={() => set("tier", t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <SliderRow label="Weathering" value={lab.wear} onChange={(v) => set("wear", v)} />
          <SliderRow
            label="Window glow"
            value={lab.glow}
            min={0}
            max={2}
            format={(v) => v.toFixed(1)}
            onChange={(v) => set("glow", v)}
          />
        </section>

        <section className="lab-section">
          <h2 className="lab-section__title">Boundary · Coverage</h2>
          <ToggleRow label="Shield wall" value={lab.boundaryOn} onChange={(v) => set("boundaryOn", v)} />
          <SliderRow
            label="Covered"
            value={lab.covered}
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => set("covered", v)}
          />
        </section>

        <section className="lab-section">
          <h2 className="lab-section__title">Pathway · Recovery</h2>
          <ToggleRow label="Way back rig" value={lab.pathwayOn} onChange={(v) => set("pathwayOn", v)} />
          <SliderRow label="Readiness" value={lab.pathway} onChange={(v) => set("pathway", v)} />
        </section>

        <section className="lab-section">
          <h2 className="lab-section__title">Lifecycle</h2>
          <ToggleRow label="Confirmed damage" value={lab.damaged} onChange={(v) => set("damaged", v)} />
          <ToggleRow label="Recovering" value={lab.recovering} onChange={(v) => set("recovering", v)} />
          <SliderRow label="Unknown haze" value={lab.unknownFog} onChange={(v) => set("unknownFog", v)} />
        </section>
      </div>
    </div>
  );
}
