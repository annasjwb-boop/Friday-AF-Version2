import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import Map, { Layer, Marker, Source, type MapRef } from "react-map-gl/maplibre";
import { Canvas } from "react-three-map/maplibre";
import { LocateFixed, Siren, Sparkles, TriangleAlert } from "lucide-react";
import {
  floodAdvisoryZone,
  homeCamera,
  homePlace,
  nearbyAlerts,
  type NearbyAlert,
} from "../../data/atlas";
import { ATLAS_MODELS, type AtlasModelId } from "./models/AtlasModel";
import { AtlasSanctuary } from "./AtlasSanctuary";
import "./HomeAtlas.css";

const MODEL_STORAGE_KEY = "aidfinder:atlas-model";

function loadModelId(): AtlasModelId {
  const stored = localStorage.getItem(MODEL_STORAGE_KEY);
  const match = ATLAS_MODELS.find((m) => m.id === stored);
  return match ? match.id : "castle";
}

/** Free dark vector basemap (no API key). */
const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

/** Meters per diorama unit — sizes the sanctuary like a small landmark. */
const MODEL_SCALE = 34;

/**
 * The Home Atlas: a real night map of the user's neighborhood, pitched
 * like a flyover, with the sanctuary metaphor standing at the home
 * address. Nearby advisories and declarations render as map-native
 * layers — the same canvas that will eventually carry live disasters.
 */
export function HomeAtlas() {
  const mapRef = useRef<MapRef>(null);
  const reducedMotion = useReducedMotion() ?? false;
  const [flat, setFlat] = useState(false);
  const [openAlert, setOpenAlert] = useState<NearbyAlert | null>(null);
  const [modelId, setModelId] = useState<AtlasModelId>(loadModelId);

  useEffect(() => {
    localStorage.setItem(MODEL_STORAGE_KEY, modelId);
  }, [modelId]);

  const model = ATLAS_MODELS.find((m) => m.id === modelId) ?? ATLAS_MODELS[0];

  const recenter = () => {
    setOpenAlert(null);
    mapRef.current?.flyTo({
      center: [homePlace.longitude, homePlace.latitude],
      zoom: homeCamera.zoom,
      pitch: flat ? 0 : homeCamera.pitch,
      bearing: homeCamera.bearing,
      duration: 1400,
    });
  };

  const togglePitch = () => {
    const next = !flat;
    setFlat(next);
    mapRef.current?.easeTo({
      pitch: next ? 0 : homeCamera.pitch,
      duration: 900,
    });
  };

  const visitAlert = (alert: NearbyAlert) => {
    setOpenAlert(alert);
    mapRef.current?.flyTo({
      center: [alert.longitude, alert.latitude],
      zoom: 13.6,
      duration: 1200,
    });
  };

  return (
    <div className="atlas">
      <Map
        ref={mapRef}
        initialViewState={{
          latitude: homePlace.latitude,
          longitude: homePlace.longitude,
          ...homeCamera,
        }}
        mapStyle={MAP_STYLE}
        canvasContextAttributes={{ antialias: true }}
        attributionControl={{ compact: true }}
        onClick={() => setOpenAlert(null)}
      >
        {/* The advisory's footprint over the bay and shoreline. */}
        <Source id="flood-advisory" type="geojson" data={floodAdvisoryZone}>
          <Layer
            id="flood-advisory-fill"
            type="fill"
            paint={{ "fill-color": "#4a7ab5", "fill-opacity": 0.14 }}
          />
          <Layer
            id="flood-advisory-line"
            type="line"
            paint={{
              "line-color": "#7aa5d8",
              "line-opacity": 0.55,
              "line-width": 1.2,
              "line-dasharray": [2, 2],
            }}
          />
        </Source>

        {nearbyAlerts.map((alert) => (
          <Marker
            key={alert.id}
            latitude={alert.latitude}
            longitude={alert.longitude}
            anchor="bottom"
          >
            <button
              type="button"
              className={`atlas-alert atlas-alert--${alert.kind}${
                openAlert?.id === alert.id ? " is-open" : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
                visitAlert(alert);
              }}
            >
              {alert.kind === "declaration" ? (
                <Siren size={12} strokeWidth={2.4} aria-hidden="true" />
              ) : (
                <TriangleAlert size={12} strokeWidth={2.4} aria-hidden="true" />
              )}
              <span>{alert.title}</span>
            </button>
          </Marker>
        ))}

        {/* The sanctuary stands in the map world at the home coordinate:
            it scales with zoom and tilts with the camera. */}
        <Canvas
          latitude={homePlace.latitude}
          longitude={homePlace.longitude}
        >
          <AtlasSanctuary
            id={modelId}
            scale={MODEL_SCALE}
            reducedMotion={reducedMotion}
          />
        </Canvas>
      </Map>

      {/* Map controls, stacked on the right like a native map app. */}
      <div className="atlas-controls">
        <button
          type="button"
          className="atlas-control"
          onClick={togglePitch}
          aria-label={flat ? "Tilt to 3D view" : "Flatten to 2D view"}
        >
          {flat ? "3D" : "2D"}
        </button>
        <button
          type="button"
          className="atlas-control"
          onClick={recenter}
          aria-label="Return to your home"
        >
          <LocateFixed size={17} strokeWidth={2.1} aria-hidden="true" />
        </button>
      </div>

      {/* Bottom callout: the place card for the sanctuary on the map. */}
      <div className="atlas-callout">
        {openAlert ? (
          <div className="atlas-callout__page" key={openAlert.id}>
            <p className="atlas-callout__eyebrow">
              {openAlert.kind === "declaration" ? (
                <Siren size={14} strokeWidth={2.2} aria-hidden="true" />
              ) : (
                <TriangleAlert size={14} strokeWidth={2.2} aria-hidden="true" />
              )}
              {openAlert.kind === "declaration"
                ? "Federal declaration"
                : "Active advisory"}
            </p>
            <h1 className="atlas-callout__title">{openAlert.title}</h1>
            <p className="atlas-callout__sub">{openAlert.detail}</p>
            <button
              type="button"
              className="atlas-callout__home"
              onClick={recenter}
            >
              Back to your home
            </button>
          </div>
        ) : (
          <div className="atlas-callout__page" key="home">
            <p className="atlas-callout__eyebrow">
              <Sparkles size={14} strokeWidth={2.2} aria-hidden="true" />
              Your sanctuary
            </p>
            <h1 className="atlas-callout__title">{homePlace.address}</h1>
            <p className="atlas-callout__sub">
              {homePlace.cityLine} · {model.descriptor}
            </p>
            <div
              className="atlas-callout__models"
              role="radiogroup"
              aria-label="Sanctuary model"
            >
              {ATLAS_MODELS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={m.id === modelId}
                  className={`atlas-model${m.id === modelId ? " is-active" : ""}`}
                  onClick={() => setModelId(m.id)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
