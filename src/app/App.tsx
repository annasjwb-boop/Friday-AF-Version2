import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Routes, Route, useLocation, matchPath } from "react-router-dom";
import { MobileSimulator } from "../components/mobile/MobileSimulator";
import { MobileHeader } from "../components/mobile/MobileHeader";
import { AmbientShaderBackground } from "../components/mobile/AmbientShaderBackground";
import { LandscapeBackground } from "../components/mobile/LandscapeBackground";
import { DuskBackground } from "../components/mobile/DuskBackground";
import { SanctuaryBackground } from "../components/mobile/SanctuaryBackground";
import { SanctuaryBBackground } from "../components/mobile/SanctuaryBBackground";
import { SanctuaryBPaper } from "../components/mobile/SanctuaryBPaper";
import { SanctuaryCPaper } from "../components/mobile/SanctuaryCPaper";
import { LedgerBackground } from "../components/mobile/LedgerBackground";
import { CasitaBackground } from "../components/mobile/CasitaBackground";
import { RecoveryPlanProvider } from "./RecoveryPlanContext";
import { BackgroundProvider } from "./BackgroundProvider";
import { SanctuaryStoryProvider } from "./SanctuaryStoryProvider";
import { useBackground } from "./background";
import { useSanctuaryStory } from "./sanctuaryStory";
import { routes, type AppRoute } from "./routes";
import "./App.css";

// The immersive "Your Sanctuary" story carries the full 3D stack, so it
// loads on demand the first time the avatar is tapped.
const SanctuaryStoryOverlay = lazy(
  () => import("../components/sanctuary-b/SanctuaryStoryOverlay"),
);
// 4.C fork of the story overlay (Polestar-styled experience).
const SanctuaryStoryOverlayC = lazy(
  () => import("../components/sanctuary-c/SanctuaryStoryOverlay"),
);

function useActiveRoute(): AppRoute | undefined {
  const { pathname } = useLocation();
  return routes.find((route) => matchPath(route.path, pathname));
}

function AppLayout() {
  const active = useActiveRoute();
  const { variant } = useBackground();
  const { storyOpen } = useSanctuaryStory();
  const contentRef = useRef<HTMLElement>(null);
  const [headerHidden, setHeaderHidden] = useState(false);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    let lastY = el.scrollTop;
    const onScroll = () => {
      const y = el.scrollTop;
      const delta = y - lastY;
      if (y <= 8) {
        setHeaderHidden(false);
      } else if (delta > 4) {
        setHeaderHidden(true);
      } else if (delta < -4) {
        setHeaderHidden(false);
      }
      lastY = y;
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setHeaderHidden(false);
  }, [active?.path]);

  const chromeless = active?.chromeless ?? false;
  const ambient = active?.ambient ?? "full";

  // On the 4.B/4.C home the top section goes away entirely: no header, and
  // the content runs edge-to-edge. The product carries its own bottom tab
  // bar, and the sanctuary model lives on its Home chapter rather than
  // floating.
  const sanctuaryHome =
    (variant === "sanctuary-b" ||
      variant === "sanctuary-c" ||
      variant === "casita" ||
      variant === "vault") &&
    active?.path === "/";

  // The conversational UI owns its blue-shader-over-white backdrop (it moves
  // between the top and bottom of the screen with the conversation state), so
  // the selected background variant only applies to the full-frame routes.
  // Routes can also pin a specific backdrop (the Sanctuary Lab always sits
  // on the mesh gradient so the clay models read correctly). On 4.B the
  // working app sits on the ledger paper; the mesh-gradient environment
  // lives inside the "Your Sanctuary" story overlay.
  const background =
    active?.backdrop === "sanctuary-b" ? (
      <SanctuaryBBackground />
    ) : ambient === "composer" ? null : variant === "landscape" ? (
      <LandscapeBackground />
    ) : variant === "dusk" ? (
      <DuskBackground />
    ) : variant === "sanctuary" ? (
      <SanctuaryBackground />
    ) : variant === "sanctuary-b" ? (
      <SanctuaryBPaper />
    ) : variant === "sanctuary-c" ? (
      <SanctuaryCPaper />
    ) : variant === "ledger" ? (
      <LedgerBackground />
    ) : variant === "atlas" ? (
      // The atlas home is a full-bleed night map; the other routes sit on
      // the moody dusk grain so the whole variant stays dark and coherent.
      <DuskBackground />
    ) : variant === "casita" || variant === "vault" ? (
      <CasitaBackground />
    ) : (
      <AmbientShaderBackground />
    );

  return (
    <div className={`app-layout${storyOpen ? " app-layout--story" : ""}`}>
      {background}
      {!chromeless && !sanctuaryHome && (
        <MobileHeader
          title={active?.title ?? "AidFinder"}
          leading={active?.leading}
          trailing={active?.trailing}
          variant={active?.headerVariant}
          hidden={headerHidden}
        />
      )}
      <main
        className={`app-content${
          chromeless || sanctuaryHome ? " app-content--chromeless" : ""
        }`}
        ref={contentRef}
      >
        <Routes>
          {routes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Routes>
      </main>
      {variant === "sanctuary-b" && (
        <Suspense fallback={null}>
          <SanctuaryStoryOverlay />
        </Suspense>
      )}
      {variant === "sanctuary-c" && (
        <Suspense fallback={null}>
          <SanctuaryStoryOverlayC />
        </Suspense>
      )}
    </div>
  );
}

export default function App() {
  return (
    <RecoveryPlanProvider>
      <BackgroundProvider>
        <SanctuaryStoryProvider>
          <MobileSimulator>
            <AppLayout />
          </MobileSimulator>
        </SanctuaryStoryProvider>
      </BackgroundProvider>
    </RecoveryPlanProvider>
  );
}
