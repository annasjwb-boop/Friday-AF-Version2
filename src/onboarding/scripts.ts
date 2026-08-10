/* ---------------------------------------------------------------------------
 * Onboarding scripts — one per campaign door.
 *
 * Declarative rather than three hand-built components: the copy is the thing
 * being iterated on, and keeping it as data means a wording change is a text
 * edit, not a component rewrite.
 *
 * Departures from the written spec are marked SPEC below, each with a reason.
 * ------------------------------------------------------------------------- */

export type Step =
  /** A chat bubble from the assistant. */
  | { kind: "say"; text: string }
  /** Map tile zooming to the property, boxed. */
  | { kind: "map" }
  /** Confirm the matched address, and add a unit number if there is one. */
  | { kind: "confirmAddress" }
  /** Open programs, grouped by disaster. */
  | { kind: "grants" }
  /** Multi-select over the storm grants. */
  | { kind: "pickGrants" }
  /** The resiliency grant plus a yes/no. */
  | { kind: "resiliency" }
  /** Single-select chips. `other` appends a free-text option. */
  | {
      kind: "choice";
      id: string;
      options: string[];
      other?: boolean;
    }
  /** Editable property details with the rebuild-cost slider. */
  | { kind: "property" }
  /** Editable risk list. */
  | { kind: "risks" }
  /** Canopy / upload / self-insure. */
  | { kind: "insurance" }
  /** Free-text answer. */
  | { kind: "text"; id: string; placeholder: string }
  /** Account creation. */
  | { kind: "account" }
  /** Terminal step — hands off into the app. `to` may read the answers so a
      flow can land somewhere specific to what the user told us. */
  | {
      kind: "goto";
      to: string | ((answers: Record<string, string>) => string);
      label: string;
    };

export interface Script {
  id: string;
  /** Shown in the flow header so it's clear which door this came from. */
  source: string;
  steps: Step[];
}

const METAPHOR_Q =
  "One last question. Can you tell me how you think about your home? A castle? An igloo? A cabin? A secret lair?";

export const SCRIPTS: Record<string, Script> = {
  /* --- Ad 1 / homepage door 1 --------------------------------------------- */
  aid: {
    id: "aid",
    source: "Check if you qualify for aid",
    steps: [
      { kind: "say", text: "Thanks for your address. I think I found you." },
      { kind: "map" },
      {
        kind: "say",
        text: "Is this the right place? If there's an apartment or unit number, add it now — records are matched on the exact address, and a missing unit is one of the most common reasons an application stalls.",
      },
      { kind: "confirmAddress" },
      { kind: "say", text: "And do you own or rent?" },
      {
        kind: "choice",
        id: "tenure",
        options: ["I own", "I rent", "Something else"],
      },
      {
        kind: "say",
        text: "There are 4 programs open for your address right now. Three are for damage from past storms and are still accepting applications. One is for improvements that make your home stand up better to the next one.",
      },
      { kind: "grants" },
      {
        kind: "say",
        text: "Did you have damage from any of these storms? Select the ones you think might apply to you — we'll work out the details together later.",
      },
      { kind: "pickGrants" },
      {
        kind: "say",
        /* SPEC: the written line asserts "every dollar saves six dollars" as
           fact. Attributed here instead, because the figure is contested and
           this is aimed at people making real decisions. */
        text: "Now, are you interested in the resiliency grant? Your state offers up to $10,000 to help protect your home from future damage. States fund these because federal research finds mitigation money pays for itself several times over in avoided losses.",
      },
      { kind: "resiliency" },
      {
        kind: "say",
        text: "Makes sense. Let's set up your account, and then we can start putting your applications together. My job is to take your information once and package each application for you. Setting up the account now means nothing is lost if you close this window.",
      },
      { kind: "account" },
      { kind: "goto", to: "/", label: "Go to your home" },
    ],
  },

  /* --- Ad 2 / homepage door 2 --------------------------------------------- */
  coverage: {
    id: "coverage",
    source: "Worried you might be underinsured",
    steps: [
      { kind: "say", text: "Thanks for your address." },
      { kind: "map" },
      {
        kind: "say",
        text: "Is this the right place? If there's an apartment or unit number, add it now — records are matched on the exact address, and a missing unit is one of the most common reasons an application stalls.",
      },
      { kind: "confirmAddress" },
      { kind: "say", text: "And do you own or rent?" },
      {
        kind: "choice",
        id: "tenure",
        options: ["I own", "I rent", "Something else"],
      },
      {
        kind: "say",
        text: "I've pulled what public records hold about your property — size, age, materials, sale history — to estimate what it would cost to rebuild.",
      },
      {
        kind: "say",
        text: "I've also pulled the hazards for your county, and for your specific parcel where the data goes that deep.",
      },
      {
        kind: "say",
        text: "Before we go further, have a look at the details and change anything that's off. The rebuild cost and the room count matter most.",
      },
      { kind: "property" },
      {
        kind: "say",
        text: "Now the risks. We look at local wind, water and weather patterns, but nobody knows your property like you do — adjust anything that doesn't match what you've seen.",
      },
      { kind: "risks" },
      {
        kind: "say",
        text: "Last piece is your insurance. We can connect to your policy directly, you can upload your declarations page, or you can tell me you don't carry insurance.",
      },
      { kind: "insurance" },
      { kind: "say", text: METAPHOR_Q },
      {
        kind: "text",
        id: "metaphor",
        placeholder: "A castle, a cabin, a secret lair…",
      },
      /* No account step: flows 2 and 3 are the conversion test, and every
         field before the payoff costs completions. The cost is that a closed
         tab loses the property edits, risk adjustments and policy collected
         above — worth asking for once the user has seen the breakdown. */
      { kind: "goto", to: "/?tab=risk", label: "See your risk breakdown" },
    ],
  },

  /* --- Ad 3 / homepage door 3 --------------------------------------------- */
  prepare: {
    id: "prepare",
    source: "Get prepared",
    steps: [
      { kind: "say", text: "Thanks for your address. It looks like I found you." },
      { kind: "map" },
      {
        kind: "say",
        text: "Is this the right place? If there's an apartment or unit number, add it now — records are matched on the exact address, and a missing unit is one of the most common reasons an application stalls.",
      },
      { kind: "confirmAddress" },
      { kind: "say", text: "And do you own or rent?" },
      {
        kind: "choice",
        id: "tenure",
        options: ["I own", "I rent", "Something else"],
      },
      {
        kind: "say",
        text: "I've pulled what public records hold about your property — size, age, materials, history. That all goes into your profile and you'll get a chance to review it.",
      },
      {
        kind: "say",
        text: "What would you rather start with — pulling together the documents you'd need to file a claim or apply for aid, or documenting what's in your home so you can put it on a claim later?",
      },
      {
        kind: "choice",
        id: "intent",
        options: ["Organize documents", "Document my property"],
        other: true,
      },
      { kind: "say", text: METAPHOR_Q },
      {
        kind: "text",
        id: "metaphor",
        placeholder: "A castle, a cabin, a secret lair…",
      },
      {
        kind: "say",
        /* SPEC: the written closing line promised "your risk breakdown and
           coverage gaps", which belongs to flow 2 — this flow ends at the
           vault. Rewritten to describe where the user is actually going. */
        text: "I'll take you to your vault now. You can keep uploading there, or tap the assistant any time and we'll work through it together.",
      },
      {
        kind: "goto",
        /* Branches on the intent question rather than dropping everyone in the
           same place: someone who said "document my property" wants the rooms,
           not a document checklist. */
        to: (a) =>
          a.intent === "Document my property"
            ? "/?tab=readiness&vault=rooms"
            : "/?tab=readiness&vault=docs",
        label: "Open your vault",
      },
    ],
  },
};

/** Which script each campaign ad opens. */
export const AD_TO_SCRIPT: Record<string, string> = {
  "01": "aid",
  "02": "coverage",
  "03": "prepare",
  "04": "prepare",
  "05": "coverage",
};
