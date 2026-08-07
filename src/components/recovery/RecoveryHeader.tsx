import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./recovery-ui.css";

type RecoveryHeaderProps = {
  title?: string;
  /** Overrides the default history-back navigation. */
  onBack?: () => void;
};

export function RecoveryHeader({ title, onBack }: RecoveryHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="recovery-header">
      <button
        type="button"
        className="recovery-header__back"
        aria-label="Go back"
        onClick={onBack ?? (() => navigate(-1))}
      >
        <ArrowLeft size={24} strokeWidth={2} aria-hidden="true" />
      </button>
      {title ? <h1 className="recovery-header__title">{title}</h1> : null}
      <span className="recovery-header__spacer" aria-hidden="true" />
    </div>
  );
}
