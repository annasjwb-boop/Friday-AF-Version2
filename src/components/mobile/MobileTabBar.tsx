import { NavLink } from "react-router-dom";
import { Home, Compass, User, type LucideIcon } from "lucide-react";
import "./MobileTabBar.css";

type TabItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

const TABS: TabItem[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/profile", label: "Profile", icon: User },
];

export function MobileTabBar() {
  return (
    <nav className="mobile-tabbar" aria-label="Primary">
      {TABS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            `mobile-tabbar__item${isActive ? " is-active" : ""}`
          }
        >
          <Icon size={24} strokeWidth={2} aria-hidden="true" />
          <span className="mobile-tabbar__label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
