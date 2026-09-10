const R2 = "https://pub-f0ac1ec148884b718fc28632174966a4.r2.dev";

export type CaseMedia =
  | { kind: "video"; src: string; alt: string }
  | { kind: "gradient"; gradient: string; label: string }
  | { kind: "svg"; diagram: "pricing" | "finance"; alt: string };

export type CaseStudy = {
  slug: string;
  kind: "client" | "product";
  tag: string;
  title: string;
  oneLiner: string;
  stack: string[];
  span: { from: string; to?: string };
  status: "active" | "shipped" | "in-flight" | "handed-over";
  /** Client cases only: none | verbal | written. Products are Jay's own. */
  consent?: "none" | "verbal" | "written";
  published: boolean;
  media: CaseMedia;
  summary?: string;
  sections?: { heading: string; body: string[] }[];
  outcomes?: { label: string; value: string }[];
  notes?: { title: string; body: string }[];
};

export const STATUS_LABEL: Record<CaseStudy["status"], string> = {
  active: "Active engagement",
  shipped: "Shipped",
  "in-flight": "In flight",
  "handed-over": "Handed over",
};

export const work: CaseStudy[] = [
  {
    slug: "resale-pricing-engine",
    kind: "client",
    tag: "Internal tool · Retail",
    title: "Resale Pricing Engine",
    oneLiner:
      "Internal pricing tool for a pre-loved resale retailer. Staff upload an item and photos; the system pulls comparable listings, grades condition from the images, and recommends a peso price — with review, approval, batch runs, and cost tracking built in.",
    stack: ["Next.js 15", "Cloudflare Workers", "D1 + Drizzle", "R2", "Playwright"],
    span: { from: "2026-07", to: "2026-09" },
    status: "handed-over",
    consent: "written",
    published: true,
    media: {
      kind: "svg",
      diagram: "pricing",
      alt: "Flow: item and photos, comparable listings, condition read, deterministic pricing engine, review, approval, export",
    },
    summary:
      "A six-week build that turned pricing from a per-person judgment call into a repeatable, auditable workflow, then handed the whole thing to the client's team.",
    sections: [
      {
        heading: "Context",
        body: [
          "A pre-loved resale retailer prices hundreds of one-off items a month. Every piece is unique, so there is no catalogue price to copy. The right number depends on what comparable pieces are listing for right now and on condition, which staff judged by eye.",
          "Two people would price the same item differently, and nobody could say afterwards why a price was chosen.",
        ],
      },
      {
        heading: "Problem",
        body: [
          "Comparable-listing searches were manual, one item at a time. Condition grading was inconsistent between staff. There was no audit trail from listing to final price, no way to run a whole intake batch, and the cost of the third-party services behind the research was invisible until the invoice arrived.",
        ],
      },
      {
        heading: "What I built",
        body: [
          "An intake form takes the item's details and photos. The system gathers comparable listings, reads condition from the photos, and hands both to a deterministic pricing engine that produces the recommendation and the reasoning behind it.",
          "A review screen shows the comparables, the photo-based condition read, and the proposed price side by side. Approval is a separate step with its own decision bar. Exports go out with a history log so any price can be traced back.",
          "Batch mode prices an entire intake in one run. An admin area tracks service balances and spend per run, and a match-quality view shows how good the comparable matches actually are, so the team can tune categories over time.",
        ],
      },
      {
        heading: "Architecture",
        body: [
          "The codebase is layered — domain, ports, adapters, services, app — and the layering is machine-enforced: an ESLint boundary rule fails the build if a route imports a database module directly. Vendor SDKs live in adapters only, bound at a single composition root.",
          "Money is stored and computed as integer centavos. The pricing figures come from pure domain code, never from a language model; models only read photos. Fields marked private are excluded from export paths by construction, not filtered out afterwards.",
          "Deployed to Cloudflare Workers through the OpenNext adapter, with D1 for data and private R2 buckets behind signed URLs for photos. One verify command runs boundary lint, typecheck, unit tests, and Playwright end-to-end before anything merges.",
        ],
      },
    ],
    outcomes: [
      { label: "Build time", value: "6 wks" },
      { label: "Commits", value: "100+" },
      { label: "Lint-enforced layers", value: "5" },
      { label: "Floats in money math", value: "0" },
    ],
    notes: [
      {
        title: "Why the pricing math is not an LLM",
        body: "A recommendation the team can't reproduce is a recommendation they can't defend to a customer. The engine is deterministic and unit-tested; the model's only job is describing what it sees in a photo.",
      },
      {
        title: "Why exports can't leak",
        body: "Some item fields are internal. Rather than filtering them out of every export, export paths are built so they never receive those fields in the first place.",
      },
      {
        title: "Why Workers and D1",
        body: "A single-region SME tool doesn't need a fleet. Edge hosting with an embedded database keeps the monthly bill near zero and the ops surface tiny for the team that now owns it.",
      },
    ],
  },
  {
    slug: "ecommerce-finance-os",
    kind: "client",
    tag: "Finance & Ops system · E-commerce",
    title: "E-commerce Finance & Ops OS",
    oneLiner:
      "Operations and finance operating system for a Metro Manila D2C brand, built on Google Sheets + Apps Script. Shopify orders land automatically, COD and courier remittances reconcile against the cash book, and a double-entry ledger closes every month behind audit gates.",
    stack: ["Google Sheets", "Apps Script", "Shopify webhooks", "Python audit gates", "Double-entry GL"],
    span: { from: "2026-04" },
    status: "active",
    consent: "written",
    published: true,
    media: {
      kind: "svg",
      diagram: "finance",
      alt: "Flow: Shopify webhook and manual entry into the ops book, remittance and cash sync, live management view, close gates, monthly rollover",
    },
    summary:
      "A setup-plus-retainer engagement: I designed the books, automated the intake and reconciliation, and now run the weekly audit and monthly close as the brand's finance and systems consultant.",
    sections: [
      {
        heading: "Context",
        body: [
          "A direct-to-consumer brand in Metro Manila takes orders through Shopify, social DMs, and a marketplace. Most orders are cash-on-delivery through couriers and riders; the rest are prepaid through a payment gateway. A small team — owner, operations lead, admin — runs everything.",
        ],
      },
      {
        heading: "Problem",
        body: [
          "Order data was typed twice. Courier cash was invisible until it hit the bank, days later. There was no reconciled baseline and no month-end, so the owner couldn't answer the three questions every operator asks daily: how much did I make, how much do I owe, how much cash do I have.",
        ],
      },
      {
        heading: "What I built",
        body: [
          "Two Google Sheets workbooks. The Ops & Admin book is where the team works every day: order entry, deliveries, cash and e-wallet movements, expenses, courier float, physical counts, and a promotions dictionary. The Live Management View is the owner's book: journal, trial balance, profit and loss with netted platform fees, cash position, inventory and cost of goods, receivables by channel.",
          "Apps Script does the plumbing. A Shopify webhook writes new orders straight into the ops book, Manila-timezone safe, with a lock for concurrent webhooks and a fail-closed layout guard that holds a mismatched payload for replay instead of writing garbage. Remittance and COD records feed an income-event ledger; a cash-book sync posts the other side with idempotency across prefixes.",
          "Month-end is a menu inside the book. One action carries open orders forward, clears rows inherited from the prior month, reseeds counts, prunes logs, and writes an audit row for every cell it touched. Each month also gets a rendered close report that has to pass a balance check before it's issued.",
        ],
      },
      {
        heading: "How it stays correct",
        body: [
          "A set of named audit gates runs every working session: the trial balance must balance, cross-book references must resolve, no orphan rows, one platform order ID per order, and only genuinely open orders may carry across months. A gate that can't read the current book fails loudly rather than reporting green.",
          "Every material decision is an ADR and every bug gets a root-cause entry, so the rules the books run on are written down, not remembered. New Apps Script is rehearsed against a grid-capable fake of the workbook before it's deployed. Conflicts are flagged, never overwritten.",
        ],
      },
    ],
    outcomes: [
      { label: "Sessions", value: "126" },
      { label: "Decisions recorded", value: "334" },
      { label: "Root-cause analyses", value: "28" },
      { label: "Monthly closes", value: "4" },
    ],
    notes: [
      {
        title: "Why Sheets, not SaaS",
        body: "The owner can read every formula, edit any tab, and pays nothing per seat. For a team of three, an auditable spreadsheet beats a black box — as long as the automation and the gates are real.",
      },
      {
        title: "Why two books, not three",
        body: "A separate Finance book made sense on paper and doubled the reconciliation surface in practice. Retiring it and letting the management view read the ops book directly removed a whole class of drift.",
      },
      {
        title: "Why the rollover is one button",
        body: "Two buttons in two projects for one operation produced a month where nobody was sure the rollover had run. Now the carry lives inside the transition, and a standalone re-sweep remains only for orders that settle mid-month.",
      },
    ],
  },
  {
    slug: "murmura-studio",
    kind: "product",
    tag: "AI Video Production",
    title: "Murmura Studio",
    oneLiner:
      "AI video production for YouTube. Automates research, scripting, voiceover, rendering, publishing.",
    stack: ["Next.js 16", "AI SDK", "Anthropic", "Remotion", "ElevenLabs"],
    span: { from: "2026-02" },
    status: "shipped",
    published: false,
    media: { kind: "video", src: `${R2}/murmura-ad-final.mp4`, alt: "Murmura Studio showreel" },
  },
  {
    slug: "decoded-daily-news",
    kind: "product",
    tag: "AI News Platform",
    title: "Decoded Daily News",
    oneLiner:
      "Personalized daily news for professionals. 40+ sources, multi-step summarization, delivered 6 AM. Gemini→Vertex→Groq→Claude cascade keeps cost low.",
    stack: ["Python", "FastAPI", "Supabase", "Multi-LLM", "SendGrid"],
    span: { from: "2026-01" },
    status: "shipped",
    published: false,
    media: { kind: "video", src: `${R2}/ddn-ad-final.mp4`, alt: "Decoded Daily News showreel" },
  },
  {
    slug: "provly",
    kind: "product",
    tag: "Web3 Campaign Platform",
    title: "Provly",
    oneLiner:
      "On-chain campaign verification on Base. Brands post campaigns, creators submit proof, smart contracts pay out with ECDSA verification.",
    stack: ["Next.js 14", "Solidity", "Base", "tRPC", "Wagmi"],
    span: { from: "2025-11" },
    status: "shipped",
    published: false,
    media: { kind: "video", src: `${R2}/provly-broadcast-bloom-v4-15s.mp4`, alt: "Provly showreel" },
  },
  {
    slug: "athena",
    kind: "product",
    tag: "Autonomous Dev Substrate",
    title: "ATHENA",
    oneLiner:
      "Self-hosted multi-agent dev substrate. 18 agents across 3 teams, autonomous planner → coder → reviewer pipeline. Runs as a peer node in the ALEX constellation — takes sprint tickets, opens PRs.",
    stack: ["Codex GPT-5.5", "DeepSeek", "Claude Opus", "Ollama", "18 Agents"],
    span: { from: "2026-04" },
    status: "in-flight",
    published: false,
    media: {
      kind: "gradient",
      gradient: "linear-gradient(135deg, #2e1a1a 0%, #1a1a2e 100%)",
      label: "ATHENA",
    },
  },
];

export const clientWork = work.filter((w) => w.kind === "client");
export const productWork = work.filter((w) => w.kind === "product");
export const publishedWork = work.filter((w) => w.published);

export function getCase(slug: string): CaseStudy | undefined {
  return work.find((w) => w.slug === slug && w.published);
}

export function formatSpan({ from, to }: CaseStudy["span"]): string {
  const fmt = (ym: string) => {
    const [y, m] = ym.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-US", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  };
  return to ? `${fmt(from)} – ${fmt(to)}` : `${fmt(from)} – present`;
}
