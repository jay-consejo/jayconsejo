const R2 = "https://pub-f0ac1ec148884b718fc28632174966a4.r2.dev";

export type CaseMedia =
  | { kind: "video"; src: string; alt: string }
  | { kind: "gradient"; gradient: string; label: string }
  | { kind: "svg"; diagram: "pricing" | "finance" | "embedded"; alt: string };

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
  role?: string;
  runsOn?: string;
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
    role: "Sole builder",
    runsOn: "Cloudflare Workers",
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
    span: { from: "2026-04", to: "2026-10" },
    status: "handed-over",
    consent: "written",
    published: true,
    role: "Systems & finance consultant",
    runsOn: "Google Workspace",
    media: {
      kind: "svg",
      diagram: "finance",
      alt: "Flow: Shopify webhook and manual entry into the ops book, remittance and cash sync, live management view, close gates, monthly rollover",
    },
    summary:
      "A setup-plus-retainer engagement: I designed the books, automated the intake and reconciliation, and ran the weekly audit and monthly close as the brand's finance and systems consultant before handing the system over to the team.",
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
    slug: "embedded-operations-automation",
    kind: "client",
    tag: "Operations & Automation · E-commerce",
    title: "Embedded Operations & Automation",
    oneLiner:
      "Two weeks embedded as inventory lead at a US direct-to-consumer personal-care brand: a purchasing tool that shows its working, a support inbox that clears its own noise, a knowledge base that answers only from approved articles, and an accessibility audit with a fix for every finding.",
    stack: ["FastAPI", "React 19", "TypeScript", "Railway", "Shopify & Amazon APIs"],
    span: { from: "2026-09", to: "2026-10" },
    status: "handed-over",
    consent: "none",
    published: true,
    role: "Inventory lead (embedded)",
    runsOn: "Railway",
    media: {
      kind: "svg",
      diagram: "embedded",
      alt: "Flow: 3PL stock feed, reorder check, purchase order, approval, shipment, receiving, paid and closed; plus support inbox rules, knowledge base and accessibility audit",
    },
    summary:
      "A two-week embedded engagement. I took over inventory, rebuilt the purchasing tool around numbers the team can check, cleared the support inbox's noise without touching a customer, and gave support a knowledge base that answers only from its own articles.",
    sections: [
      {
        heading: "Context",
        body: [
          "A US direct-to-consumer personal-care brand sells through its own Shopify store, Amazon and TikTok. It ships from a third-party logistics (3PL) warehouse and buys from several overseas suppliers on long lead times. A small support team answers customers by email.",
          "I joined the team for about two weeks in late September 2026 as inventory lead, reporting to the CEO, and picked up purchasing, support and compliance work along the way.",
        ],
      },
      {
        heading: "Problem",
        body: [
          "The inventory tool's numbers couldn't be trusted. For one supplier's four-product reorder, its suggestion came to about seven times the order I rebuilt by hand from three months of data. Most of it was on a product that already had more than six months of stock.",
          "Its days-until-reorder figure could swing by about two weeks overnight with no change in stock. TikTok orders went straight to the 3PL, so they never reached its demand. And one screen quietly deleted pending purchase-order lines.",
          "Support had a different problem: real customer emails sat among hundreds of machine notifications. The median first reply was about 1.3 hours, under a third of emails got an answer inside the one-hour target, and roughly one in eight got none.",
        ],
      },
      {
        heading: "Inventory and purchasing",
        body: [
          "A new version of the inventory tool, running on real data. It reads the 3PL's stock every 30 minutes, read-only and without keeping customer details. On its first read, the units owed to customers matched the 3PL's own count exactly. A Reorder Check shows the steps behind every number. While Amazon isn't connected, shipments to Amazon count as demand on the warehouse, so products that sell mostly there say \"order\" early, never late.",
          "On top of it, a purchase-order module covers suppliers and their terms, orders from draft to closed, rounding to minimum order quantities, boxes and pallets, and approval above a set amount, where nobody approves their own order. It also tracks shipments, receiving by the 3PL's count, payments and follow-ups. A user guide and an operations guide went with it.",
          "Then the purchasing itself: daily stock checks, open orders with three suppliers, and six supplier studies. Each study was built from the full chat history with that supplier: order history, quoted lead times against actual, late shipments, payments, freight and receiving, plus a checklist for every order. Actual deposit-to-arrival times ran from 48 to 86 days.",
        ],
      },
      {
        heading: "Support and accessibility",
        body: [
          "870 open tickets that needed no work (ad-platform approvals and receipts, good-review alerts, deleted comments, spam) were labelled and closed in one pass. Nothing was sent to anyone, and every ticket can be reopened. Four rules now close the same noise as it arrives. The first overnight check closed 13, all correct, with no customer ticket touched.",
          "Automatic answers to product questions are built and tested, but not switched on. On 59 practice tickets the answer rules were right every time, and the one-question check caught every email that asked more than one thing. An answer goes out by itself only when it passes every check: one approved topic, one question, no existing order, the whole answer in approved facts, and nothing sensitive.",
          "A support knowledge base the team owns instead of renting: 39 articles built from the brand's own website, a search, and an Ask box that answers only with passages from those articles and says so when the answer isn't there. It found the right article for 20 of 20 test questions and refused 10 of 10 off-topic ones. A new-starter course (5 stages, 19 lessons, 84 questions) lets supervisors follow each learner's progress.",
          "An accessibility audit of a flagship product page against WCAG 2.2 AA found 18 issues. Three were critical, all in the buying path, inside third-party widgets that didn't work by keyboard or screen reader. The CEO got a summary. The developers got a report with a fix, code and a \"done when\" test for every finding, plus a six-week fix plan.",
        ],
      },
      {
        heading: "How it stays safe",
        body: [
          "Nothing customer-facing changed without the CEO's approval. New numbers ship beside the old ones with their switches off, and turning one on needs the CEO's OK.",
          "Before the purchase-order module went live, an independent review found 12 issues. Ten were fixed first, including both serious ones: cancelling an order could leave a warehouse delivery locked, and an approved large order could have its supplier or lines swapped at the same total without a new approval. The other two were left on purpose, with the reasons written down. The full test run passed 1,615 server checks and 349 screen checks, and a security check found nothing critical or high.",
          "Updates go out on Monday mornings after a backup, never on a Friday and never during the peak-season freeze. There are always at least two super admins, so one forgotten password can't lock everyone out.",
        ],
      },
    ],
    outcomes: [
      { label: "Embedded", value: "2 wks" },
      { label: "Noise tickets closed", value: "870" },
      { label: "Ask-box test answers", value: "20/20" },
      { label: "Automated checks passed", value: "1,964" },
    ],
    notes: [
      {
        title: "Why the reorder number shows its working",
        body: "If the inventory owner can't check a figure, they'll override it by gut. The Reorder Check lays out every step, and new numbers run beside the old ones, switched off, until someone has compared them.",
      },
      {
        title: "Why the Ask box doesn't write",
        body: "Agents repeat what it shows to customers. So it returns passages from approved articles word for word, and says when the answer isn't there, rather than writing something that only sounds right.",
      },
      {
        title: "Why automation started with noise",
        body: "Closing machine notifications can't upset a customer, and every closed ticket can be reopened. Starting there cleared the inbox safely and set up the real goal: the one-hour reply target with the agents already on the team, without hiring.",
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

/** Stable anchor id for a section heading ("What I built" → "what-i-built"). */
export function toId(heading: string): string {
  return heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
