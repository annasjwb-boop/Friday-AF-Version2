import type { Feature, Polygon } from "geojson";

/**
 * Home Atlas variant: the user's real place in the world. The address is
 * the same "1204 Bayshore Lane" the sanctuary product greets with, seated
 * on Tampa's Bayshore waterfront — which is also why the sample narrative
 * in `home.ts` is dominated by flood and wind exposure.
 */
export const homePlace = {
  address: "1204 Bayshore Lane",
  cityLine: "Tampa, Florida",
  latitude: 27.9105,
  longitude: -82.4926,
};

/** The composed hero framing the map returns to when recentering. */
export const homeCamera = {
  zoom: 16.2,
  pitch: 60,
  bearing: 24,
};

export type NearbyAlert = {
  id: string;
  kind: "advisory" | "declaration";
  title: string;
  detail: string;
  latitude: number;
  longitude: number;
};

/** Live hazard context around the home — advisories and declarations. */
export const nearbyAlerts: NearbyAlert[] = [
  {
    id: "coastal-flood",
    kind: "advisory",
    title: "Coastal Flood Advisory",
    detail: "NWS Tampa Bay · until Fri 7:00 AM",
    latitude: 27.9182,
    longitude: -82.4838,
  },
  {
    id: "dr-4828",
    kind: "declaration",
    title: "DR-4828 Major Disaster",
    detail: "Hurricane Milton · Hillsborough County",
    latitude: 27.9482,
    longitude: -82.4599,
  },
];

/** The advisory's footprint: the bay and its immediate shoreline. */
export const floodAdvisoryZone: Feature<Polygon> = {
  type: "Feature",
  properties: { title: "Coastal Flood Advisory" },
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [-82.4888, 27.9238],
        [-82.4762, 27.9108],
        [-82.4736, 27.8922],
        [-82.463, 27.8808],
        [-82.4468, 27.8902],
        [-82.4436, 27.9174],
        [-82.4552, 27.9376],
        [-82.4742, 27.9404],
        [-82.4888, 27.9238],
      ],
    ],
  },
};
