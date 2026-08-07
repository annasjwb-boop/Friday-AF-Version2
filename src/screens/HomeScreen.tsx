import { lazy, Suspense, useState } from "react";
import { useBackground } from "../app/background";
import { RiskScoreWidget } from "../components/home/RiskScoreWidget";
import { RiskScoreHero } from "../components/home/RiskScoreHero";
import { RiskScoreHeroFlipped } from "../components/home/RiskScoreHeroFlipped";

// The 3D stack (three.js + react-three-fiber) is heavy, so the sanctuary
// variants load on demand and leave the other variants' bundle untouched.
const SanctuaryHero = lazy(() =>
  import("../components/sanctuary/SanctuaryHero").then((m) => ({
    default: m.SanctuaryHero,
  })),
);
// The atlas carries maplibre plus the 3D stack, so it also loads on demand.
const HomeAtlas = lazy(() =>
  import("../components/atlas/HomeAtlas").then((m) => ({
    default: m.HomeAtlas,
  })),
);
// Casita carries the metaphorical-home 3D system plus postprocessing, so it
// also loads on demand.
const CasitaHome = lazy(() =>
  import("../components/casita/CasitaHome").then((m) => ({
    default: m.CasitaHome,
  })),
);
// Variant 10 "Readiness Vault": the documentation & home-inventory experience.
const VaultHome = lazy(() =>
  import("../components/vault/VaultHome").then((m) => ({
    default: m.VaultHome,
  })),
);
import {
  RiskScoreDetails,
  type DetailsOrigin,
} from "../components/home/RiskScoreDetails";
import { RecoveryPlanWidget } from "../components/home/RecoveryPlanWidget";
import { AidReadinessWidget } from "../components/home/AidReadinessWidget";
import { CoverageWidget } from "../components/home/CoverageWidget";
import { CoverageDetails } from "../components/home/CoverageDetails";
import { LedgerOverview } from "../components/home/LedgerOverview";
import { ErrorBoundary } from "../components/ui/ErrorBoundary";
import { SanctuaryProduct } from "../components/sanctuary-product/SanctuaryProduct";
import { SanctuaryProduct as SanctuaryProductC } from "../components/sanctuary-product-c/SanctuaryProduct";
import {
  coverageItems,
  insurer,
  policyCoverages,
  policyExclusions,
  readinessCards,
  readinessProgress,
  riskActions,
  riskScore,
} from "../data/home";
import "./screen.css";
import "./HomeScreen.css";

export function HomeScreen() {
  const { variant } = useBackground();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsOrigin, setDetailsOrigin] = useState<DetailsOrigin | null>(null);
  const [coverageOpen, setCoverageOpen] = useState(false);
  const [coverageOrigin, setCoverageOrigin] = useState<DetailsOrigin | null>(
    null,
  );

  const openDetails = (origin: DetailsOrigin | null) => {
    setDetailsOrigin(origin);
    setDetailsOpen(true);
  };

  const openCoverage = (origin: DetailsOrigin | null) => {
    setCoverageOrigin(origin);
    setCoverageOpen(true);
  };

  const landscape = variant === "landscape";
  const dusk = variant === "dusk";
  const sanctuary = variant === "sanctuary";
  // 4.B: the working app carries the core risk / readiness / recovery
  // screens in their own light editorial language; the sanctuary itself
  // lives in the immersive story opened from the header avatar, with the
  // view controlled so the story's final action can route to one.
  const sanctuaryB = variant === "sanctuary-b";
  // 4.C: same product structure as 4.B, restyled in the Polestar language.
  const sanctuaryC = variant === "sanctuary-c";
  const ledger = variant === "ledger";

  // Variant 6 "Home Atlas": the sanctuary metaphor standing at the user's
  // real address on a live night map — full-screen, like the 4.A hero.
  if (variant === "atlas") {
    return (
      <div className="screen home-screen home-screen--sanctuary home-screen--atlas">
        <Suspense fallback={null}>
          <HomeAtlas />
        </Suspense>
      </div>
    );
  }

  // Variant 7 "Casita": the metaphorical-home maquette inside a dark-chrome
  // product shell, with tabs driving the model's state parameters.
  if (variant === "casita") {
    return (
      <div className="screen home-screen home-screen--casita">
        {/* The 3D stack can fail hard (stale chunk, lost GPU context); the
            boundary keeps that from blanking the entire app. */}
        <ErrorBoundary>
          <Suspense fallback={null}>
            <CasitaHome />
          </Suspense>
        </ErrorBoundary>
      </div>
    );
  }

  // Variant 10 "Readiness Vault": document uploads plus a room-by-room home
  // inventory, in the Casita design language.
  if (variant === "vault") {
    return (
      <div className="screen home-screen home-screen--casita">
        <ErrorBoundary>
          <Suspense fallback={null}>
            <VaultHome />
          </Suspense>
        </ErrorBoundary>
      </div>
    );
  }

  // The 4.A sanctuary variant is a self-contained full-screen 3D experience.
  if (sanctuary) {
    return (
      <div className="screen home-screen home-screen--sanctuary">
        <Suspense fallback={null}>
          <SanctuaryHero />
        </Suspense>
      </div>
    );
  }

  const widgets = (
    <>
      <RecoveryPlanWidget />
      <AidReadinessWidget progress={readinessProgress} cards={readinessCards} />
      <CoverageWidget
        items={coverageItems}
        insurer={insurer}
        onOpen={openCoverage}
      />
    </>
  );

  return (
    <div
      className={`screen home-screen${landscape ? " home-screen--landscape" : ""}${dusk ? " home-screen--dusk" : ""}${ledger ? " home-screen--ledger" : ""}${sanctuaryB || sanctuaryC ? " home-screen--sanctuaryb" : ""}`}
    >
      {landscape ? (
        <>
          <RiskScoreHero score={riskScore} onOpen={openDetails} />
          {/* Progressive backdrop blur where the imagery meets the cards. */}
          <div className="home-scrim" aria-hidden="true" />
          <div className="home-sheet">{widgets}</div>
        </>
      ) : dusk ? (
        <>
          {/* Flipped-meter hero on the grain; widgets share one full-bleed
              frosted sheet, stacked flush with hairline seams. */}
          <RiskScoreHeroFlipped score={riskScore} />
          <div className="home-sheet-dusk">{widgets}</div>
        </>
      ) : sanctuaryB ? (
        /* 4.B: one coherent product — the sanctuary at home, with risk,
           readiness, and recovery as its supporting chapters. */
        <SanctuaryProduct onOpenRisk={openDetails} />
      ) : sanctuaryC ? (
        <SanctuaryProductC onOpenRisk={openDetails} />
      ) : ledger ? (
        /* Financial overview hero + asset library / score cards; the risk
           metric card opens the shared risk details sheet below. */
        <LedgerOverview onOpenRisk={openDetails} />
      ) : (
        <>
          <RiskScoreWidget score={riskScore} onOpen={openDetails} />
          {widgets}
        </>
      )}

      <RiskScoreDetails
        open={detailsOpen}
        score={riskScore}
        actions={riskActions}
        origin={detailsOrigin}
        onClose={() => setDetailsOpen(false)}
      />

      <CoverageDetails
        open={coverageOpen}
        insurer={insurer}
        coverages={policyCoverages}
        exclusions={policyExclusions}
        origin={coverageOrigin}
        onClose={() => setCoverageOpen(false)}
      />
    </div>
  );
}
