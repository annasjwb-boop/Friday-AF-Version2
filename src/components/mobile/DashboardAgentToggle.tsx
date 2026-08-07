import { useLocation, useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import "./DashboardAgentToggle.css";

type Mode = "dashboard" | "agent";

/** AidFinder logomark — inherits color via currentColor */
export function AidFinderMark() {
  return (
    <svg
      width={17}
      height={17}
      viewBox="20 20 514 514"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="136" cy="140" r="72" />
      <path d="M272 344C328.57 344 352 367.43 352 424A72 72 0 1 0 424 352C367.43 352 344 328.57 344 272A72 72 0 1 0 272 344Z" />
      <path d="M323 170C365.43 170 383 187.57 383 230A72 72 0 1 0 455 158C412.57 158 395 140.43 395 98A72 72 0 1 0 323 170Z" />
      <path d="M98 395C140.43 395 158 412.57 158 455A72 72 0 1 0 230 383C187.57 383 170 365.43 170 323A72 72 0 1 0 98 395Z" />
    </svg>
  );
}

export function DashboardAgentToggle() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const mode: Mode = pathname === "/assistant" ? "agent" : "dashboard";

  return (
    <div className={`mode-toggle mode-toggle--${mode}`} role="group">
      <button
        type="button"
        className="mode-toggle__option"
        aria-label="Dashboard"
        aria-pressed={mode === "dashboard"}
        onClick={() => mode !== "dashboard" && navigate("/")}
      >
        <Home size={16} strokeWidth={2} aria-hidden="true" />
      </button>
      <button
        type="button"
        className="mode-toggle__option"
        aria-label="Assistant"
        aria-pressed={mode === "agent"}
        onClick={() => mode !== "agent" && navigate("/assistant")}
      >
        <AidFinderMark />
      </button>
    </div>
  );
}
