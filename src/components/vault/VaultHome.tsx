import { BatteryFull, Signal, Wifi } from "lucide-react";
import { VaultBody } from "./VaultBody";
import "./VaultHome.css";

/**
 * Variant 10 "Readiness Vault" — the standalone host: its own dark chrome
 * and white sheet around the shared vault body. Inside Casita, the same
 * body renders on the Readiness tab without this chrome.
 */
export function VaultHome() {
  return (
    <div className="vault">
      <header className="vault__top">
        <div className="vault__status" aria-hidden="true">
          <span className="vault__time">9:41</span>
          <span className="vault__status-icons">
            <Signal size={14} strokeWidth={2.2} />
            <Wifi size={14} strokeWidth={2.2} />
            <BatteryFull size={18} strokeWidth={1.8} />
          </span>
        </div>
        <div className="vault__bar">
          <div>
            <h1 className="vault__title">Readiness</h1>
            <p className="vault__address">1200 Edwards Dr, Fort Myers, FL 33901</p>
          </div>
          <button type="button" className="vault__avatar" aria-label="Profile">
            <span aria-hidden="true">JB</span>
          </button>
        </div>
      </header>

      <div className="vault__sheet">
        <VaultBody />
      </div>
    </div>
  );
}
