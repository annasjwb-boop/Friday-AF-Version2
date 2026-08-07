import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Eye, EyeOff, FlaskConical } from "lucide-react";
import type { SanctuaryProfile } from "../../types/sanctuary";
import type { ChannelToggles } from "./models/state";

const DIMENSIONS = [
  { id: "risk", label: "Risk" },
  { id: "readiness", label: "Readiness" },
  { id: "coverage", label: "Coverage" },
  { id: "recovery", label: "Recovery" },
] as const;

type DimensionKey = (typeof DIMENSIONS)[number]["id"];

/** Rebuild value implied by the sample data: 71% covered ≈ $185k gap. */
const GAP_PER_POINT = 6380;

/**
 * Development-only control revealed by tapping the status line. Drives the
 * four profile dimensions independently so every channel mapping can be
 * tuned by eye: a slider per dimension, a "?" toggle to preview the unknown
 * (hazy) treatment, an eye toggle to remove that channel's visuals from the
 * scene entirely, and a chip for the confirmed-damage override.
 */
export function ProfileDemoControl({
  value,
  channels,
  onChange,
  onChannelsChange,
}: {
  value: SanctuaryProfile;
  channels: ChannelToggles;
  onChange: (profile: SanctuaryProfile) => void;
  onChannelsChange: (channels: ChannelToggles) => void;
}) {
  const setDimension = (id: DimensionKey, v: number | null) => {
    const next: SanctuaryProfile = { ...value, [id]: v };
    if (id === "coverage") {
      next.coverageGapUsd =
        v === null
          ? null
          : Math.round(((100 - v) * GAP_PER_POINT) / 5000) * 5000;
    }
    onChange(next);
  };

  return (
    <motion.div
      className="sanctuary-c-demo"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.24, ease: [0.3, 0, 0.2, 1] }}
    >
      <span className="sanctuary-c-demo__label">Demo · profile scores</span>
      {DIMENSIONS.map(({ id, label }) => {
        const v = value[id];
        const on = channels[id];
        return (
          <div
            key={id}
            className={`sanctuary-c-demo__slider-row${on ? "" : " is-muted"}`}
          >
            <span className="sanctuary-c-demo__slider-label">{label}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={v ?? 60}
              disabled={v === null || !on}
              aria-label={`${label} score`}
              onChange={(e) => setDimension(id, Number(e.target.value))}
            />
            <span className="sanctuary-c-demo__slider-value">
              {v === null ? "—" : v}
            </span>
            <button
              type="button"
              className={`sanctuary-c-demo__chip${v === null ? " is-active" : ""}`}
              aria-pressed={v === null}
              title="Toggle unknown"
              disabled={!on}
              onClick={() => setDimension(id, v === null ? 60 : null)}
            >
              ?
            </button>
            <button
              type="button"
              className={`sanctuary-c-demo__chip${on ? "" : " is-active"}`}
              aria-pressed={!on}
              title={on ? "Hide this channel in the scene" : "Show this channel"}
              onClick={() => onChannelsChange({ ...channels, [id]: !on })}
            >
              {on ? (
                <Eye size={12} aria-hidden="true" />
              ) : (
                <EyeOff size={12} aria-hidden="true" />
              )}
            </button>
          </div>
        );
      })}
      <div className="sanctuary-c-demo__footer">
        <button
          type="button"
          className={`sanctuary-c-demo__chip${value.confirmedDamage ? " is-active" : ""}`}
          aria-pressed={value.confirmedDamage}
          onClick={() =>
            onChange({ ...value, confirmedDamage: !value.confirmedDamage })
          }
        >
          Confirmed damage
        </button>
        <Link to="/sanctuary-lab" className="sanctuary-c-demo__chip">
          <FlaskConical size={12} aria-hidden="true" /> Open the lab
        </Link>
      </div>
    </motion.div>
  );
}
