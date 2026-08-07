import { Compass } from "lucide-react";
import "./screen.css";

export function ExploreScreen() {
  return (
    <div className="screen">
      <div className="screen__placeholder">
        <span className="screen__placeholder-icon">
          <Compass size={28} strokeWidth={2} aria-hidden="true" />
        </span>
        <p className="screen__placeholder-title">Explore</p>
        <p className="screen__placeholder-text">
          This is a placeholder destination. Aid programs and resources will
          live here.
        </p>
      </div>
    </div>
  );
}
