import { User } from "lucide-react";
import "./screen.css";

export function ProfileScreen() {
  return (
    <div className="screen">
      <div className="screen__placeholder">
        <span className="screen__placeholder-icon">
          <User size={28} strokeWidth={2} aria-hidden="true" />
        </span>
        <p className="screen__placeholder-title">Profile</p>
        <p className="screen__placeholder-text">
          This is a placeholder destination. Account details and settings will
          live here.
        </p>
      </div>
    </div>
  );
}
