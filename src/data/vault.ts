/* ---------------------------------------------------------------------------
 * Readiness Vault — sample data for the documentation & home-inventory
 * variant. Documents prove who you are and what you own; rooms hold the
 * itemized personal property that turns a claim from an argument into a
 * checklist.
 * ------------------------------------------------------------------------- */

export type DocumentStatus = "verified" | "pending" | "missing";

export type VaultDocument = {
  id: string;
  name: string;
  /** Why this document matters for aid and claims. */
  why: string;
  status: DocumentStatus;
  meta?: string;
};

export const VAULT_DOCUMENTS: VaultDocument[] = [
  {
    id: "deed",
    name: "Property deed",
    why: "Proves ownership on every application",
    status: "verified",
    meta: "Fulton County · Added Jul 18",
  },
  {
    id: "policy",
    name: "Homeowners policy",
    why: "Coverage terms on file before you need them",
    status: "verified",
    meta: "USAA #HO-4471892 · Renews Sep 24",
  },
  {
    id: "mortgage",
    name: "Mortgage statement",
    why: "Lenders are paid first from claim checks",
    status: "pending",
    meta: "Uploaded today · Verifying",
  },
  {
    id: "id",
    name: "Government ID",
    why: "Speeds identity checks on every application",
    status: "missing",
  },
  {
    id: "utility",
    name: "Utility bill",
    why: "Proves occupancy for FEMA assistance",
    status: "missing",
  },
  {
    id: "appraisal",
    name: "Home appraisal",
    why: "Backs your rebuild estimate with evidence",
    status: "missing",
  },
];

export type VaultItem = {
  id: string;
  name: string;
  value: number;
  photo: boolean;
  receipt: boolean;
};

export type VaultRoom = {
  id: string;
  name: string;
  photoCount: number;
  videoCount?: number;
  items: VaultItem[];
};

export const VAULT_ROOMS: VaultRoom[] = [
  {
    id: "living",
    name: "Living Room",
    photoCount: 6,
    videoCount: 1,
    items: [
      { id: "tv", name: 'LG C3 OLED TV · 65"', value: 1899, photo: true, receipt: true },
      { id: "sofa", name: "Article Sven leather sofa", value: 2299, photo: true, receipt: false },
      { id: "console", name: "West Elm media console", value: 1099, photo: true, receipt: false },
      { id: "sonos", name: "Sonos Arc + Sub", value: 1547, photo: true, receipt: true },
      { id: "eames", name: "Eames lounge chair & ottoman", value: 6995, photo: true, receipt: false },
      { id: "rug", name: "Wool area rug · 9×12", value: 649, photo: false, receipt: true },
      { id: "appletv", name: "Apple TV 4K + remotes", value: 179, photo: false, receipt: false },
      { id: "art", name: "Framed art & decor", value: 1200, photo: true, receipt: false },
    ],
  },
  {
    id: "kitchen",
    name: "Kitchen",
    photoCount: 4,
    items: [
      { id: "fridge", name: "Samsung Bespoke refrigerator", value: 2799, photo: true, receipt: true },
      { id: "mixer", name: "KitchenAid stand mixer", value: 449, photo: true, receipt: true },
      { id: "espresso", name: "Breville Barista Express", value: 749, photo: true, receipt: false },
      { id: "lecreuset", name: "Le Creuset cookware set", value: 1150, photo: true, receipt: false },
      { id: "range", name: "GE Profile gas range", value: 2199, photo: true, receipt: false },
      { id: "vitamix", name: "Vitamix blender", value: 549, photo: false, receipt: false },
      { id: "dishes", name: "Dishes & flatware", value: 600, photo: false, receipt: false },
    ],
  },
  {
    id: "bedroom",
    name: "Primary Bedroom",
    photoCount: 3,
    items: [
      { id: "bed", name: "King bed + Tempur-Pedic", value: 3299, photo: true, receipt: false },
      { id: "dresser", name: "Solid oak dresser", value: 1450, photo: true, receipt: false },
      { id: "jewelry", name: "Jewelry & watches", value: 2800, photo: false, receipt: false },
      { id: "clothing", name: "Wardrobe & clothing", value: 3500, photo: false, receipt: false },
      { id: "nightstands", name: "Nightstands + lamps", value: 520, photo: true, receipt: false },
      { id: "tablets", name: "iPad Pro + Kindle", value: 980, photo: true, receipt: true },
    ],
  },
  {
    id: "office",
    name: "Home Office",
    photoCount: 5,
    items: [
      { id: "macbook", name: 'MacBook Pro 16"', value: 2899, photo: true, receipt: true },
      { id: "display", name: "Apple Studio Display", value: 1599, photo: true, receipt: true },
      { id: "aeron", name: "Herman Miller Aeron", value: 1395, photo: true, receipt: false },
      { id: "desk", name: "Fully Jarvis standing desk", value: 899, photo: true, receipt: false },
      { id: "camera", name: "Sony A7 IV camera kit", value: 2400, photo: false, receipt: false },
      { id: "network", name: "Router, NAS & peripherals", value: 760, photo: false, receipt: false },
    ],
  },
  {
    id: "garage",
    name: "Garage",
    photoCount: 2,
    items: [
      { id: "tools", name: "DeWalt tool collection", value: 780, photo: true, receipt: false },
      { id: "bike", name: "Trek Fuel EX 8", value: 3600, photo: true, receipt: true },
      { id: "grill", name: "Weber Genesis grill", value: 959, photo: false, receipt: false },
      { id: "yard", name: "Ladder, mower & blower", value: 850, photo: false, receipt: false },
      { id: "camping", name: "Camping gear", value: 640, photo: false, receipt: false },
    ],
  },
  {
    id: "basement",
    name: "Basement",
    photoCount: 0,
    items: [],
  },
];

/* ---------------------------------------------------------------------------
 * AI walkthrough (beta) — the simulated capture session. In the moment the
 * camera only notes the rough phrase it heard; matching items from the video
 * and pricing them with a reverse image search happens in a processing pass
 * after the session. Room assignment happens in the camera: the member tags
 * a room in the moment, or leaves Auto on and the AI's detected room (baked
 * into each step) is used.
 * ------------------------------------------------------------------------- */

export type WalkthroughStep = {
  id: string;
  /** What the member says as they walk. */
  transcript: string;
  /** Resolved after processing: matched name, price, and any follow-up. */
  item: {
    name: string;
    value: number;
    /** Where the price came from: spoken in the video, or an estimate that
        still needs verifying (image match, receipt, proof of purchase). */
    source: "video" | "estimate";
    /** Follow-up the AI suggests, if any. */
    flag?: string;
  };
};

/** A finished session's items, grouped by the room they belong to. */
export type WalkthroughBatch = {
  roomId: string;
  roomName: string;
  items: VaultItem[];
};

const DINING_STEPS: WalkthroughStep[] = [
  {
    id: "table",
    transcript:
      "Walnut dining table, seats eight. We got it from Room & Board around 2021.",
    item: {
      name: "Room & Board walnut dining table",
      value: 2285,
      source: "estimate",
    },
  },
  {
    id: "chairs",
    transcript:
      "Six upholstered dining chairs, same order — I think the set was around $2,100.",
    item: {
      name: "Upholstered dining chairs · set of 6",
      value: 2100,
      source: "video",
    },
  },
  {
    id: "credenza",
    transcript:
      "There's a sideboard along the wall — mid-century, it was my grandmother's.",
    item: {
      name: "Mid-century walnut credenza",
      value: 1400,
      source: "estimate",
      flag: "Heirloom — appraisal suggested",
    },
  },
  {
    id: "rug",
    transcript: "Big jute rug under the table, maybe nine by twelve.",
    item: { name: "Jute area rug · 9×12", value: 480, source: "estimate" },
  },
  {
    id: "chandelier",
    transcript: "A brass chandelier over the table — came with the house.",
    item: {
      name: "Brass 6-arm chandelier",
      value: 650,
      source: "estimate",
    },
  },
  {
    id: "china",
    transcript:
      "And the china cabinet has my wedding china — twelve place settings.",
    item: {
      name: "Wedding china · 12 settings",
      value: 900,
      source: "estimate",
      flag: "Add close-up photos",
    },
  },
];

const KITCHEN_STEPS: WalkthroughStep[] = [
  {
    id: "copper",
    transcript:
      "Copper cookware set hanging on the rack — ten pieces, maybe more.",
    item: {
      name: "Copper cookware set · 10 pc",
      value: 420,
      source: "estimate",
    },
  },
  {
    id: "smartoven",
    transcript:
      "A Breville smart oven on the counter — paid $280 for it last year.",
    item: { name: "Breville Smart Oven Air", value: 280, source: "video" },
  },
  {
    id: "knives",
    transcript: "The knife block — it's the Wüsthof set we got as a gift.",
    item: {
      name: "Wüsthof knife block set",
      value: 350,
      source: "estimate",
      flag: "Add close-up photo",
    },
  },
  {
    id: "stools",
    transcript: "Three leather counter stools at the island.",
    item: {
      name: "Leather counter stools · set of 3",
      value: 450,
      source: "estimate",
    },
  },
];

const BASEMENT_STEPS: WalkthroughStep[] = [
  {
    id: "treadmill",
    transcript:
      "Down in the basement — the NordicTrack treadmill, paid about eleven hundred for it.",
    item: { name: "NordicTrack treadmill", value: 1100, source: "video" },
  },
  {
    id: "freezer",
    transcript: "Chest freezer along the back wall.",
    item: { name: "Chest freezer", value: 600, source: "estimate" },
  },
  {
    id: "shelving",
    transcript: "Metal shelving with all of our storage bins.",
    item: {
      name: "Shelving + storage bins",
      value: 380,
      source: "estimate",
    },
  },
  {
    id: "holiday",
    transcript: "And all the holiday decorations stacked in the corner.",
    item: {
      name: "Holiday decorations",
      value: 250,
      source: "estimate",
      flag: "Consider itemizing",
    },
  },
];

export type ContinuousStep = WalkthroughStep & {
  roomId: string;
  roomName: string;
};

/* The continuous take wanders dining → kitchen → basement, so the room tag
   visibly changes as the AI follows along. */
export const CONTINUOUS_SCRIPT: ContinuousStep[] = [
  ...DINING_STEPS.slice(0, 3).map((s) => ({
    ...s,
    roomId: "dining",
    roomName: "Dining Room",
  })),
  ...KITCHEN_STEPS.slice(0, 2).map((s) => ({
    ...s,
    roomId: "kitchen",
    roomName: "Kitchen",
  })),
  ...BASEMENT_STEPS.slice(0, 1).map((s) => ({
    ...s,
    roomId: "basement",
    roomName: "Basement",
  })),
];

export function formatValue(value: number): string {
  return `$${value.toLocaleString("en-US")}`;
}

/** Document name for mid-sentence use — lowercased, but acronyms intact. */
export function docPhrase(name: string): string {
  return name.toLowerCase().replace(/\bid\b/g, "ID").replace(/\bfema\b/g, "FEMA");
}
