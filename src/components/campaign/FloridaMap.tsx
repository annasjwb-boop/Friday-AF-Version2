import { useMemo } from "react";
import Map, { Layer, Source } from "react-map-gl/mapbox";
import type { CircleLayerSpecification } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./FloridaMap.css";

/* ---------------------------------------------------------------------------
 * Florida choropleth, on real Mapbox tiles.
 *
 * Configured entirely through env vars so the token never lands in the repo:
 *
 *   VITE_MAPBOX_TOKEN   required — the map does not render without it
 *   VITE_MAPBOX_STYLE   optional — defaults to Mapbox Light
 *
 * With no token this renders nothing and the caller falls back to the SVG
 * silhouette. That's deliberate: a missing env var on a preview deploy should
 * degrade the map, not break the page.
 * ------------------------------------------------------------------------- */

export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as
  | string
  | undefined;

const MAPBOX_STYLE =
  (import.meta.env.VITE_MAPBOX_STYLE as string | undefined) ??
  "mapbox://styles/mapbox/light-v11";

/**
 * Fifteen county centres, ordered panhandle → Keys to match the ordering the
 * layer value arrays already used. Approximate centres, good enough for a
 * dot plot; swap for real centroids when the data is wired up.
 */
const COUNTIES: { name: string; lng: number; lat: number }[] = [
  { name: "Escambia", lng: -87.28, lat: 30.61 },
  { name: "Leon", lng: -84.28, lat: 30.44 },
  { name: "Alachua", lng: -82.35, lat: 29.65 },
  { name: "Duval", lng: -81.66, lat: 30.33 },
  { name: "Volusia", lng: -81.02, lat: 29.21 },
  { name: "Orange", lng: -81.38, lat: 28.54 },
  { name: "Brevard", lng: -80.61, lat: 28.08 },
  { name: "Polk", lng: -81.95, lat: 28.04 },
  { name: "Hillsborough", lng: -82.46, lat: 27.95 },
  { name: "Pinellas", lng: -82.68, lat: 27.77 },
  { name: "Lee", lng: -81.87, lat: 26.64 },
  { name: "Palm Beach", lng: -80.05, lat: 26.71 },
  { name: "Broward", lng: -80.14, lat: 26.12 },
  { name: "Miami-Dade", lng: -80.19, lat: 25.76 },
  { name: "Monroe", lng: -81.78, lat: 24.56 },
];

/* Framed on the peninsula rather than the state's true centre — the
   panhandle would otherwise pull the view west and shrink the part of the
   map where most of the data sits. */
const INITIAL_VIEW = {
  longitude: -82.6,
  latitude: 28.1,
  zoom: 5.45,
};

export function FloridaMap({
  accent,
  values,
}: {
  accent: string;
  /** Per-county intensity, 0–1, in the same order as COUNTIES. */
  values: number[];
}) {
  const data = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: COUNTIES.map((c, i) => ({
        type: "Feature" as const,
        properties: { name: c.name, v: values[i] ?? 0 },
        geometry: {
          type: "Point" as const,
          coordinates: [c.lng, c.lat],
        },
      })),
    }),
    [values],
  );

  /* Ring and fill mirror the SVG version they replace: a soft halo scaled to
     the value, with a denser dot inside it. */
  const ring: CircleLayerSpecification = {
    id: "county-ring",
    type: "circle",
    source: "counties",
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["get", "v"], 0, 8, 1, 30],
      "circle-color": "transparent",
      "circle-stroke-color": accent,
      "circle-stroke-width": 1.2,
      "circle-stroke-opacity": [
        "interpolate",
        ["linear"],
        ["get", "v"],
        0,
        0.1,
        1,
        0.4,
      ],
    },
  };

  const fill: CircleLayerSpecification = {
    id: "county-fill",
    type: "circle",
    source: "counties",
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["get", "v"], 0, 4, 1, 18],
      "circle-color": accent,
      "circle-opacity": [
        "interpolate",
        ["linear"],
        ["get", "v"],
        0,
        0.22,
        1,
        0.82,
      ],
    },
  };

  return (
    <div className="flmap">
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={INITIAL_VIEW}
        mapStyle={MAPBOX_STYLE}
        /* The map sits mid-page, so grabbing the wheel would trap the reader
           mid-scroll. Drag and the zoom controls still work. */
        scrollZoom={false}
        dragRotate={false}
        touchPitch={false}
        attributionControl={true}
        style={{ width: "100%", height: "100%" }}
      >
        <Source id="counties" type="geojson" data={data}>
          <Layer {...ring} />
          <Layer {...fill} />
        </Source>
      </Map>
    </div>
  );
}
