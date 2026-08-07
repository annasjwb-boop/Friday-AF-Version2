import { lazy, Suspense, type ReactElement } from "react";
import { Menu } from "lucide-react";
import { HomeScreen } from "../screens/HomeScreen";
import { AssistantScreen } from "../screens/AssistantScreen";
import { ExploreScreen } from "../screens/ExploreScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { RecoverySetupScreen } from "../screens/RecoverySetupScreen";

// Lazy: the lab carries the whole three.js scene, so it loads on demand
// like the sanctuary heroes do.
const SanctuaryLabScreen = lazy(() =>
  import("../screens/SanctuaryLabScreen").then((m) => ({
    default: m.SanctuaryLabScreen,
  })),
);
import { RecoveryOverviewScreen } from "../screens/RecoveryOverviewScreen";
import { SupportOptionsScreen } from "../screens/SupportOptionsScreen";
import { PersonalResourcesScreen } from "../screens/PersonalResourcesScreen";
import { DashboardAgentToggle } from "../components/mobile/DashboardAgentToggle";
import { IconButton } from "../components/ui/IconButton";

export type AppRoute = {
  path: string;
  title: string;
  element: ReactElement;
  leading?: ReactElement;
  trailing?: ReactElement;
  headerVariant?: "default" | "transparent";
  /** Hides the app header and tab bar; the screen provides its own chrome. */
  chromeless?: boolean;
  /**
   * Shader placement: "full" floods the frame (default); "composer" drops it
   * to a soft band at the bottom so it glows behind the composer zone.
   */
  ambient?: "full" | "composer";
  /** Pins a specific backdrop regardless of the selected background variant. */
  backdrop?: "sanctuary-b";
};

export const routes: AppRoute[] = [
  {
    path: "/",
    title: "",
    element: <HomeScreen />,
    leading: <DashboardAgentToggle />,
    trailing: (
      <IconButton label="Menu">
        <Menu size={24} strokeWidth={2} aria-hidden="true" />
      </IconButton>
    ),
    headerVariant: "transparent",
  },
  {
    path: "/assistant",
    title: "Assistant",
    element: <AssistantScreen />,
    chromeless: true,
    ambient: "composer",
  },
  {
    path: "/sanctuary-lab",
    title: "Sanctuary Lab",
    element: (
      <Suspense fallback={null}>
        <SanctuaryLabScreen />
      </Suspense>
    ),
    chromeless: true,
    backdrop: "sanctuary-b",
  },
  { path: "/explore", title: "Explore", element: <ExploreScreen /> },
  { path: "/profile", title: "Profile", element: <ProfileScreen /> },
  {
    path: "/recovery/setup",
    title: "Recovery Plan",
    element: <RecoverySetupScreen />,
    chromeless: true,
  },
  {
    path: "/recovery",
    title: "Recovery Plan",
    element: <RecoveryOverviewScreen />,
    chromeless: true,
  },
  {
    path: "/recovery/support",
    title: "Support options",
    element: <SupportOptionsScreen />,
    chromeless: true,
  },
  {
    path: "/recovery/resources",
    title: "Personal resources",
    element: <PersonalResourcesScreen />,
    chromeless: true,
  },
];
