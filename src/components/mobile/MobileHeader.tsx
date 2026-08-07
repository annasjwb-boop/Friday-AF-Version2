import { type ReactNode } from "react";
import "./MobileHeader.css";

type MobileHeaderProps = {
  title: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  variant?: "default" | "transparent";
  hidden?: boolean;
};

export function MobileHeader({
  title,
  leading,
  trailing,
  variant = "default",
  hidden = false,
}: MobileHeaderProps) {
  return (
    <header
      className={`mobile-header mobile-header--${variant}${
        hidden ? " mobile-header--hidden" : ""
      }`}
    >
      <div className="mobile-header__leading">
        {leading ?? <span className="mobile-header__spacer" aria-hidden="true" />}
      </div>
      <h1 className="mobile-header__title">{title}</h1>
      <div className="mobile-header__trailing">
        {trailing ?? (
          <span className="mobile-header__spacer" aria-hidden="true" />
        )}
      </div>
    </header>
  );
}
