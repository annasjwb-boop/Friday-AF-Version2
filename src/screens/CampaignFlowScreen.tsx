import {
  StateHomepageMock,
  LAYERS,
} from "../components/campaign/StateHomepageMock";
import "./CampaignFlowScreen.css";

/* ---------------------------------------------------------------------------
 * Campaign flow — the paid and organic doors into AidFinder.
 *
 * Ported from the standalone campaign-flow deck into the app, restyled from
 * the old charcoal/amber language into the light one the product now uses.
 *
 * The ads no longer link anywhere. The old deck pointed 01 and 02 at separate
 * onboarding HTML files; those flows are being rebuilt inside the app, so a
 * live link would only lead somewhere stale. Every destination below is
 * marked pending on purpose.
 * ------------------------------------------------------------------------- */

interface Ad {
  n: string;
  hook: string;
  /** The figure the creative leads with, carried through to the landing page. */
  stat: string;
  url: string;
  dest: string;
}

const ADS: Ad[] = [
  {
    n: "01",
    stat: "$8.2B",
    hook: "in aid has gone to your state after disasters in the last ten years.",
    url: "Claim your property",
    dest: "Claim property",
  },
  {
    n: "02",
    stat: "16%",
    hook: "is how far the typical policy in your ZIP falls short of rebuild cost.",
    url: "Check your coverage",
    dest: "Risk score",
  },
  {
    n: "03",
    stat: "Still",
    hook: "keeping your documents in the washing machine when a storm comes?",
    url: "Build your doc vault",
    dest: "Doc vault",
  },
  {
    n: "04",
    stat: "Every",
    hook: "document the state already holds about you — want access to it?",
    url: "Pull your records",
    dest: "Doc vault",
  },
  {
    n: "05",
    stat: "Ready?",
    hook: "Find out whether your household is, before the next major disaster.",
    url: "Check your risk",
    dest: "Risk score",
  },
];

const ENTRY_POINTS = [
  {
    name: "Claim property",
    sub: "Address, ownership, verification",
    from: ["01"],
  },
  { name: "Risk score", sub: "Hazard and coverage gap", from: ["02", "05"] },
  { name: "Doc vault", sub: "Upload, tag, retrieve", from: ["03", "04"] },
];

export function CampaignFlowScreen() {
  return (
    <div className="cf">
      <div className="cf__wrap">
        <header className="cf__head">
          <h1 className="cf__title">Campaign flow</h1>
          <p className="cf__lede">
            Five campaigns and a state homepage, feeding three entry points.
            Creative is placeholder — the figure in each image is the hook that
            carries through to the landing page.
          </p>
        </header>

        <p className="cf__sect">Paid campaigns</p>

        <div className="cf__ads">
          {ADS.map((ad) => (
            <article className="ad" key={ad.n}>
              <div className="ad__top">
                <span className="ad__av">A</span>
                <span className="ad__who">
                  AidFinder
                  <em>Sponsored</em>
                </span>
                <span className="ad__n">{ad.n}</span>
              </div>

              <div className="ad__creative">
                <p className="ad__stat">
                  <strong>{ad.stat}</strong> {ad.hook}
                </p>
              </div>

              <div className="ad__cta">
                <span className="ad__url">
                  usaidfinder.com
                  <strong>{ad.url}</strong>
                </span>
                <span className="ad__go">Learn more</span>
              </div>

              <div className="ad__foot">
                <span className="ad__dest">{ad.dest}</span>
                <span className="ad__state">Flow to build</span>
              </div>
            </article>
          ))}
        </div>

        <p className="cf__sect">State homepage</p>
        <p className="cf__lede cf__lede--tight">
          The homepage is the sixth door. Its hero rotates through four calls to
          action, each dropping the visitor into the same flow as the matching
          paid campaign — same landing page, same address search, same result
          panel. Nothing separate gets built for organic traffic. As the call to
          action rotates, the map layer swaps so the claim on screen is the
          claim being mapped.
        </p>

        {/* The mock carries its own prototype chrome bar, so this frame
            contributes the address and nothing that would stack under it. */}
        <p className="cf__addr">usaidfinder.com/fl</p>
        <div className="cf__browser">
          <StateHomepageMock />
        </div>

        <div className="cf__doors">
          {LAYERS.map((d) => (
            <div className="door" key={d.key}>
              <p className="door__cta">{d.cta}</p>
              <p className="door__layer">
                <b>Map layer</b>
                {d.layerName}
              </p>
              <div className="door__foot">
                <span>{d.dest}</span>
                <span className="door__state">Flow to build</span>
              </div>
            </div>
          ))}
        </div>

        <p className="cf__sect">Where each campaign lands</p>

        <div className="cf__routes">
          {ENTRY_POINTS.map((ep) => (
            <div className="route" key={ep.name}>
              <div className="route__from">
                {ep.from.map((n) => (
                  <span className="route__pill" key={n}>
                    {n}
                  </span>
                ))}
              </div>
              <div className="route__box">
                <span className="route__name">{ep.name}</span>
                <span className="route__sub">{ep.sub}</span>
              </div>
            </div>
          ))}
        </div>

        <p className="cf__shared">
          All three entry points write to the same household record — which is
          why the order someone arrives in doesn't change what they end up with.
        </p>

        <div className="cf__notes">
          <p className="cf__note">
            <b>One thing to decide.</b> The fourth homepage door points at a
            recovery plan, which no campaign feeds. Every paid campaign is
            pre-disaster; the homepage is the only place a post-landfall visitor
            could enter, and right now that door leads somewhere unbuilt.
          </p>
          <p className="cf__note cf__note--warn">
            <b>Before any of this goes public.</b> Every figure here is a
            placeholder — the $8.2B, the 16% underinsurance gap, the 14
            documents, and all 60 county values across the four map layers.
            Intended sources are named on the homepage footer (OpenFEMA, FEMA
            NFHL, ZIP-level aggregates), but nothing has been pulled or checked
            yet. These read as authoritative, which is exactly why they need
            sourcing before a real visitor sees them.
          </p>
        </div>
      </div>
    </div>
  );
}
