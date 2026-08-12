import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import Map, { Layer, Marker, Source } from "react-map-gl/mapbox";
import type { CircleLayerSpecification } from "mapbox-gl";
import { ArrowLeft, Copy, Globe, Mail, Phone, Star, X } from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_TOKEN } from "../campaign/FloridaMap";
import {
  HOME,
  rankedInspectors,
  type Inspector,
} from "../../data/inspectors";
import { money } from "../../data/disaster";
import "./InspectorSheet.css";

/* ---------------------------------------------------------------------------
 * Finding someone to write an estimate.
 *
 * Ordered by rating then distance, with the reason each one is surfaced sitting
 * on the card — "handles surge lines", "writes to Xactimate" — because a list
 * of five contractors with four-point-something stars tells you nothing about
 * which to call for the damage you actually have.
 *
 * Licence numbers are shown next to the ratings on purpose. After a storm,
 * unlicensed contracting is one of the commonest ways survivors lose money,
 * and a number that can be checked is worth more than a star rating that can't.
 * ------------------------------------------------------------------------- */

function draftEmail(damage: number, address: string) {
  return {
    subject: `Estimate request — storm damage at ${address}`,
    body: `Hello,

I'm looking for a written estimate for storm damage to my home at ${address}, following Hurricane Elena.

I've documented roughly ${money(damage)} of damage across the structure, contents, vehicle and exterior. I have photographs of every room, pre-storm values for the contents, and my insurance declarations page — I can send all of it ahead of a visit.

I'm applying to FEMA and SBA, so I need the estimate itemised in a form they'll accept.

Could you let me know your availability and what you charge for an inspection?

Thank you,
Jane Barrett
${address}`,
  };
}

export function InspectorSheet({
  damage,
  address,
  onClose,
}: {
  damage: number;
  address: string;
  onClose: () => void;
}) {
  const list = useMemo(() => rankedInspectors(), []);
  const [chosen, setChosen] = useState<Inspector | null>(null);
  const [copied, setCopied] = useState(false);

  const draft = chosen ? draftEmail(damage, address) : null;

  const points = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: list.map((i) => ({
        type: "Feature" as const,
        properties: { rating: i.rating },
        geometry: { type: "Point" as const, coordinates: [i.lng, i.lat] },
      })),
    }),
    [list],
  );

  const dots: CircleLayerSpecification = {
    id: "inspector-dots",
    type: "circle",
    source: "inspectors",
    paint: {
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["get", "rating"],
        4.4,
        7,
        5,
        12,
      ],
      "circle-color": "#0a84ff",
      "circle-opacity": 0.85,
      "circle-stroke-color": "#fff",
      "circle-stroke-width": 2,
    },
  };

  const copy = async () => {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(
        `Subject: ${draft.subject}\n\n${draft.body}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* Clipboard can be blocked; the text is selectable either way. */
    }
  };

  const host = document.getElementById("app-viewport");

  const panel = (
    <motion.div
      className="insp"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
    >
      <header className="insp__top">
        {chosen ? (
          <button
            type="button"
            className="insp__back"
            onClick={() => setChosen(null)}
            aria-label="Back to the list"
          >
            <ArrowLeft size={18} strokeWidth={2} aria-hidden="true" />
          </button>
        ) : null}
        <div>
          <p className="insp__kicker">
            {chosen ? "Request a quote" : "Near your home"}
          </p>
          <h2 className="insp__title">
            {chosen ? chosen.name : "Licensed inspectors"}
          </h2>
        </div>
        <button
          type="button"
          className="insp__close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={19} strokeWidth={2} aria-hidden="true" />
        </button>
      </header>

      <div className="insp__scroll">
        {!chosen && (
          <>
            <div className="insp__map">
              {MAPBOX_TOKEN ? (
                <Map
                  mapboxAccessToken={MAPBOX_TOKEN}
                  initialViewState={{ ...HOME, zoom: 11.2 }}
                  mapStyle="mapbox://styles/mapbox/light-v11"
                  scrollZoom={false}
                  dragRotate={false}
                  attributionControl={true}
                  style={{ width: "100%", height: "100%" }}
                >
                  <Source id="inspectors" type="geojson" data={points}>
                    <Layer {...dots} />
                  </Source>
                  {/* The home is a distinct marker rather than another dot —
                      the whole point is where these sit relative to it. */}
                  <Marker longitude={HOME.lng} latitude={HOME.lat}>
                    <span className="insp__home" aria-label="Your home" />
                  </Marker>
                </Map>
              ) : (
                <div className="insp__map-fallback">Map unavailable</div>
              )}
            </div>

            <p className="insp__note">
              Ranked by rating, then distance. Licence numbers are shown so you
              can check them — after a storm, unlicensed contracting is one of
              the commonest ways survivors lose money.
            </p>

            {list.map((i) => (
              <article className="insp-card" key={i.id}>
                <div className="insp-card__top">
                  <p className="insp-card__name">{i.name}</p>
                  <p className="insp-card__rating">
                    <Star size={12} strokeWidth={2.4} aria-hidden="true" />
                    {i.rating}
                    <span>({i.reviews})</span>
                  </p>
                </div>
                <p className="insp-card__spec">
                  {i.speciality} · {i.distance} mi
                </p>
                <p className="insp-card__why">{i.why}</p>

                <div className="insp-card__contact">
                  <span>
                    <Phone size={12} strokeWidth={2} aria-hidden="true" />
                    {i.phone}
                  </span>
                  <span>
                    <Mail size={12} strokeWidth={2} aria-hidden="true" />
                    {i.email}
                  </span>
                  <span>
                    <Globe size={12} strokeWidth={2} aria-hidden="true" />
                    {i.website}
                  </span>
                </div>

                <p className="insp-card__licence">Licence {i.licence}</p>

                <button
                  type="button"
                  className="insp-card__cta"
                  onClick={() => setChosen(i)}
                >
                  Request a quote
                </button>
              </article>
            ))}
          </>
        )}

        {chosen && draft && (
          <>
            <p className="insp__note">
              Drafted from what you've already documented. Edit anything before
              you send it.
            </p>

            <label className="insp-draft__field">
              <span>To</span>
              <input readOnly value={chosen.email} />
            </label>

            <label className="insp-draft__field">
              <span>Subject</span>
              <input defaultValue={draft.subject} />
            </label>

            <label className="insp-draft__field">
              <span>Message</span>
              <textarea defaultValue={draft.body} rows={16} />
            </label>

            <div className="insp-draft__acts">
              <a
                className="insp-draft__send"
                href={`mailto:${chosen.email}?subject=${encodeURIComponent(
                  draft.subject,
                )}&body=${encodeURIComponent(draft.body)}`}
              >
                <Mail size={15} strokeWidth={2} aria-hidden="true" />
                Open in email
              </a>
              <button type="button" onClick={copy}>
                <Copy size={14} strokeWidth={2} aria-hidden="true" />
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <p className="insp__note">
              Ask for the estimate itemised — FEMA and SBA both price from line
              items rather than a single total.
            </p>
          </>
        )}
      </div>
    </motion.div>
  );

  return host ? createPortal(panel, host) : panel;
}
