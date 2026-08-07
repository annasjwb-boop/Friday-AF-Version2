import type { MouseEvent } from "react";
import { ShieldCheck } from "lucide-react";
import type { CoverageItem } from "../../types";
import type { DetailsOrigin } from "./RiskScoreDetails";
import "./home-widgets.css";
import "./CoverageWidget.css";

type Insurer = {
  name: string;
  policyNumber: string;
  renews: string;
};

type CoverageWidgetProps = {
  items: CoverageItem[];
  insurer: Insurer;
  onOpen: (origin: DetailsOrigin | null) => void;
};

export function CoverageWidget({ items, insurer, onOpen }: CoverageWidgetProps) {
  const covered = items.filter((item) => item.status === "covered").length;

  const handleOpen = (event: MouseEvent<HTMLButtonElement>) => {
    const buttonRect = event.currentTarget.getBoundingClientRect();
    const device = document
      .getElementById("app-device")
      ?.getBoundingClientRect();
    const origin = device
      ? {
          x: buttonRect.left + buttonRect.width / 2 - device.left,
          y: buttonRect.top + buttonRect.height / 2 - device.top,
        }
      : null;
    onOpen(origin);
  };

  return (
    <section className="home-widget coverage">
      <div className="home-widget__header">
        <h2 className="home-widget__title">Current Coverage</h2>
        <p className="home-widget__subtitle">
          {covered} of {items.length} key protections found
        </p>
      </div>

      <ul className="coverage__list">
        {items.map((item) => (
          <li key={item.id} className="coverage__row">
            <span className="coverage__label">{item.label}</span>
            {item.status === "covered" ? (
              <span className="coverage__status">Covered</span>
            ) : (
              <span className="coverage__tag">Not covered</span>
            )}
          </li>
        ))}
      </ul>

      <div className="coverage__insurer">
        <span className="coverage__avatar" aria-hidden="true">
          <ShieldCheck size={16} strokeWidth={2.25} />
        </span>
        <span className="coverage__insurer-text">
          {insurer.name} · {insurer.policyNumber} · {insurer.renews}
        </span>
      </div>

      <button type="button" className="home-cta" onClick={handleOpen}>
        View coverage details
      </button>
    </section>
  );
}
