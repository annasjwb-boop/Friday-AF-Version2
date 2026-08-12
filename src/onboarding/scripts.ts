/* ---------------------------------------------------------------------------
 * Onboarding scripts — one per campaign door.
 *
 * Declarative rather than three hand-built components: the copy is the thing
 * being iterated on, and keeping it as data means a wording change is a text
 * edit, not a component rewrite.
 *
 * Departures from the written spec are marked SPEC below, each with a reason.
 * ------------------------------------------------------------------------- */

/** Steps can be jumped to by label, which is what makes the address loop work. */
export interface StepBase {
  label?: string;
  /**
   * Append this step's answer to the named key instead of replacing it, so a
   * step reached more than once builds a list rather than overwriting what
   * came before. Entries are joined with "|".
   */
  accumulate?: string;
  /**
   * How long to hold before this step appears, in ms. The typing indicator
   * runs for the whole wait, so a longer pause reads as the assistant
   * composing rather than as the app having stalled.
   */
  pause?: number;
}

export type Step = StepBase &
  (
  /**
   * A chat bubble from the assistant. Text and pause may read the answers so
   * far, so a line can respond to what was just said — same escape hatch goto
   * already uses for its destination.
   */
  | {
      kind: "say";
      text: string | ((answers: Record<string, string>) => string);
      pauseFrom?: (answers: Record<string, string>) => number;
    }
  /** Map tile zooming to the property, boxed. */
  | { kind: "map" }
  /**
   * Confirm the matched address, and add a unit number if there is one.
   * Rejecting jumps to `retryTo`; confirming jumps past the retry block to
   * `okTo`, so the loop can sit inline without being walked into.
   */
  | { kind: "confirmAddress"; retryTo: string; okTo: string }
  /** Re-enter the address, then jump back to `backTo` to re-locate it. */
  | { kind: "askAddress"; backTo: string }
  /** Open programs, grouped by disaster. */
  | { kind: "grants" }
  /** Multi-select over the storm grants. */
  | { kind: "pickGrants"; id: string }
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
  /** Canopy wizard / upload / self-insure. `vehicle` shifts the copy. */
  | { kind: "insurance"; vehicle?: boolean }
  /** Another policy, a vehicle policy, or done. Loops back to `againTo`. */
  | { kind: "morePolicies"; againTo: string; doneTo: string }
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
    }
  );

export interface Script {
  id: string;
  /** Shown in the flow header so it's clear which door this came from. */
  source: string;
  steps: Step[];
}

/** Matches the reply the storm picker sends when nothing is selected. */
export const NO_STORMS = "Neither of these damaged my home";

/**
 * The policies collected so far, as readable phrases.
 *
 * Answers that aren't a connected policy — no insurance, carrier not listed —
 * are dropped, since listing them as things we hold would be false.
 */
function policyList(raw?: string): string[] {
  return (raw ?? "")
    .split("|")
    .map((v) => v.replace(/^Connected my /, "").trim())
    .filter((v) => v && !/^(I don't|Couldn't|Uploaded)/.test(v));
}

function joinList(items: string[]): string {
  if (items.length < 2) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
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
      { kind: "map", label: "locate" },
      {
        kind: "say",
        text: "Is this the right place? If there's an apartment or unit number, add it now — records are matched on the exact address, and a missing unit is one of the most common reasons an application stalls.",
      },
      { kind: "confirmAddress", retryTo: "fixAddress", okTo: "confirmed" },
      {
        kind: "say",
        label: "fixAddress",
        text: "No problem — what's the right address?",
      },
      { kind: "askAddress", backTo: "locate" },
      {
        kind: "say",
        label: "confirmed",
        text: "And do you own or rent?",
      },
      {
        kind: "choice",
        id: "tenure",
        options: ["I own", "I rent", "Something else"],
      },
      {
        kind: "say",
        text: "There are 4 programs open for your address right now. Three are for damage from past storms and are still accepting applications. One is for improvements that make your home stand up better to the next one.",
      },
      {
        kind: "say",
        text: "Here are the storms and programs I found:",
        pause: 2000,
      },
      { kind: "grants", pause: 1000 },
      {
        kind: "say",
        text: "Which of these storms actually damaged your home? I'll hold onto these programs until you create an account.",
      },
      { kind: "pickGrants", id: "storms" },
      {
        /* Acknowledges before continuing, and says less when there is less to
           say — someone who picked nothing has no programs to hold. */
        kind: "say",
        text: (a) =>
          a.storms === NO_STORMS
            ? "Got it!"
            : "Got it! I'll save these to your profile and we can review together shortly.",
        pauseFrom: (a) => (a.storms === NO_STORMS ? 1000 : 2000),
      },
      {
        kind: "say",
        /* SPEC: the written line asserts "every dollar saves six dollars" as
           fact. Attributed here instead, because the figure is contested and
           this is aimed at people making real decisions. */
        text: "There's one more, and it's for damage that hasn't happened yet. Do you want to apply for the state's resiliency grant? States fund these because federal research finds mitigation money pays for itself several times over in avoided losses.",
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
      { kind: "map", label: "locate" },
      {
        kind: "say",
        text: "Is this the right place? If there's an apartment or unit number, add it now — records are matched on the exact address, and a missing unit is one of the most common reasons an application stalls.",
      },
      { kind: "confirmAddress", retryTo: "fixAddress", okTo: "confirmed" },
      {
        kind: "say",
        label: "fixAddress",
        text: "No problem — what's the right address?",
      },
      { kind: "askAddress", backTo: "locate" },
      {
        kind: "say",
        label: "confirmed",
        text: "And do you own or rent?",
      },
      {
        kind: "choice",
        id: "tenure",
        options: ["I own", "I rent", "Something else"],
      },
      { kind: "say", text: "Thanks!" },
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
      { kind: "say", text: "Got it." },
      {
        kind: "say",
        text: "Now the risks. We have pulled data from NASA, NOAA, and leading models for weather related risks for your property. That said, nobody knows your property like you do.",
      },
      {
        kind: "say",
        text: "Before we check your coverage, let us know if we should add any categories, and tune those risks we have found.",
      },
      { kind: "risks" },
      {
        kind: "say",
        text: "Last piece is your insurance. We can connect to your policy directly, you can upload your declarations page, or you can tell me you don't carry insurance.",
      },
      { kind: "insurance", label: "policy", accumulate: "policies" },

      /* Households routinely hold more than one policy, and the vehicle one
         matters here — comprehensive auto covers flood damage to a car that
         the home policy excludes for the house. Asking once and moving on
         would miss it. */
      {
        kind: "say",
        label: "afterPolicy",
        /* Names what's on file rather than saying "that's on file", so someone
           connecting a second policy can see the first one is still there —
           otherwise the only evidence is a reply bubble scrolled off screen. */
        text: (a) => {
          const list = policyList(a.policies);
          if (list.length === 0) {
            return "Got it. Anything else to connect?";
          }
          if (list.length === 1) {
            return `Got it — I have your ${list[0]} on file. Anything else to connect?`;
          }
          return `Got it — I now have all ${list.length} on file: ${joinList(
            list,
          )}. Anything else to connect?`;
        },
      },
      { kind: "morePolicies", againTo: "policy", doneTo: "wrapUp" },

      /* SPEC: the metaphor question is dropped here. It fed nothing in this
         flow, and it sat between a person finishing a real task and the answer
         they came for. */
      {
        kind: "say",
        label: "wrapUp",
        text: "Thanks — that's everything I need. Let me show you your Coverage Score.",
      },
      /* No account step: flows 2 and 3 are the conversion test, and every
         field before the payoff costs completions. The cost is that a closed
         tab loses the property edits, risk adjustments and policy collected
         above — worth asking for once the user has seen the breakdown. */
      { kind: "goto", to: "/?tab=risk", label: "See your Coverage Score" },
    ],
  },

  /* --- Ad 3 / homepage door 3 --------------------------------------------- */
  prepare: {
    id: "prepare",
    source: "Get prepared",
    steps: [
      { kind: "say", text: "Thanks for your address. It looks like I found you." },
      { kind: "map", label: "locate" },
      {
        kind: "say",
        text: "Is this the right place? If there's an apartment or unit number, add it now — records are matched on the exact address, and a missing unit is one of the most common reasons an application stalls.",
      },
      { kind: "confirmAddress", retryTo: "fixAddress", okTo: "confirmed" },
      {
        kind: "say",
        label: "fixAddress",
        text: "No problem — what's the right address?",
      },
      { kind: "askAddress", backTo: "locate" },
      {
        kind: "say",
        label: "confirmed",
        text: "And do you own or rent?",
      },
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
