type DiagramId = "pricing" | "finance";

type Stagger = { i?: number };
type BoxProps = Stagger & {
  x: number;
  y: number;
  w?: number;
  h?: number;
  label: string;
  sub?: string;
  accent?: boolean;
  fs?: number;
};

function Box({ x, y, w = 128, h = 52, label, sub, accent, i = 0, fs = 12 }: BoxProps) {
  return (
    <g className="node" style={{ "--i": i } as React.CSSProperties}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={10}
        fill="var(--card)"
        stroke={accent ? "var(--accent-gold)" : "var(--border)"}
        strokeWidth={accent ? 1.5 : 1}
      />
      <text
        x={x + w / 2}
        y={y + (sub ? h / 2 - 4 : h / 2 + 1)}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={fs}
        fontWeight={600}
        fill={accent ? "var(--accent-gold)" : "var(--foreground)"}
      >
        {label}
      </text>
      {sub && (
        <text
          x={x + w / 2}
          y={y + h / 2 + 12}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={9.5}
          fill="var(--muted-foreground)"
        >
          {sub}
        </text>
      )}
    </g>
  );
}

/**
 * Two paths per connector: the static line that draws itself in on reveal, and
 * a gold pulse that keeps travelling the same route on a loop so the process
 * reads as something that runs, not a static org chart. The pulse carries
 * `pathLength` so one set of dash keyframes fits every route; the base line
 * keeps raw lengths, which its own draw-in already accounts for.
 */
function Arrow({ d, i = 0, marker }: Stagger & { d: string; marker: string }) {
  const style = { "--i": i } as React.CSSProperties;
  return (
    <g>
      <path
        className="flow"
        style={style}
        d={d}
        fill="none"
        stroke="var(--text-secondary)"
        strokeWidth={1.25}
        strokeOpacity={0.7}
        markerEnd={`url(#${marker})`}
      />
      <path
        className="flow-pulse"
        style={style}
        d={d}
        pathLength={100}
        fill="none"
        stroke="var(--accent-gold)"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </g>
  );
}

function Frame({
  marker,
  title,
  w,
  h,
  children,
}: {
  marker: string;
  title: string;
  w: number;
  h: number;
  children: React.ReactNode;
}) {
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={title}
      className="block w-full bg-surface font-sans"
      style={{ aspectRatio: `${w} / ${h}` }}
    >
      <defs>
        <marker
          id={marker}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0 0 L10 5 L0 10 z" fill="var(--text-secondary)" fillOpacity={0.7} />
        </marker>
      </defs>
      <text
        x={30}
        y={28}
        fontSize={10}
        letterSpacing={2.2}
        fill="var(--accent-gold)"
        fillOpacity={0.85}
        fontWeight={600}
      >
        {title.toUpperCase()}
      </text>
      {children}
    </svg>
  );
}

const PRICING_TITLE = "Intake to approved price";
const FINANCE_TITLE = "Order to closed month";

function PricingWide() {
  const m = "arrow-pricing-w";
  return (
    <Frame marker={m} title={PRICING_TITLE} w={640} h={360}>
      <Box x={32} y={90} label="Item + photos" sub="staff intake form" i={0} />
      <Arrow marker={m} d="M160 116 H188" i={0} />
      <Box x={190} y={90} label="Comps gather" sub="comparable listings" i={1} />
      <Arrow marker={m} d="M318 116 H346" i={1} />
      <Box x={348} y={90} label="Condition read" sub="from photos only" i={2} />
      <Arrow marker={m} d="M476 116 H504" i={2} />
      <Box x={506} y={90} w={102} label="Pricing" sub="deterministic" accent i={3} />

      <Arrow marker={m} d="M557 142 V190 H540" i={3} />
      <Box x={412} y={190} label="Review" sub="comps + photos + price" i={4} />
      <Arrow marker={m} d="M412 216 H384" i={4} />
      <Box x={254} y={190} label="Approval" sub="separate decision" i={5} />
      <Arrow marker={m} d="M254 216 H226" i={5} />
      <Box x={96} y={190} label="Export" sub="private fields excluded" accent i={6} />

      <Box x={32} y={282} w={150} h={44} label="Batch runs" sub="whole intake at once" i={7} />
      <Box x={198} y={282} w={150} h={44} label="Cost dashboard" sub="spend per run" i={8} />
      <Box x={364} y={282} w={150} h={44} label="Match quality" sub="tune categories" i={9} />
      <text x={608} y={318} textAnchor="end" fontSize={9.5} fill="var(--muted-foreground)">
        Workers · D1 · R2
      </text>
    </Frame>
  );
}

/** Same seven steps as the wide layout, stacked so they fit a 375px screen. */
function PricingTall() {
  const m = "arrow-pricing-t";
  return (
    <Frame marker={m} title={PRICING_TITLE} w={320} h={554}>
      <Box x={30} y={46} w={260} h={44} label="Item + photos" sub="staff intake form" i={0} />
      <Arrow marker={m} d="M160 90 V106" i={0} />
      <Box x={30} y={108} w={260} h={44} label="Comps gather" sub="comparable listings" i={1} />
      <Arrow marker={m} d="M160 152 V168" i={1} />
      <Box x={30} y={170} w={260} h={44} label="Condition read" sub="from photos only" i={2} />
      <Arrow marker={m} d="M160 214 V230" i={2} />
      <Box x={30} y={232} w={260} h={44} label="Pricing" sub="deterministic" accent i={3} />
      <Arrow marker={m} d="M160 276 V292" i={3} />
      <Box x={30} y={294} w={260} h={44} label="Review" sub="comps + photos + price" i={4} />
      <Arrow marker={m} d="M160 338 V354" i={4} />
      <Box x={30} y={356} w={260} h={44} label="Approval" sub="separate decision" i={5} />
      <Arrow marker={m} d="M160 400 V416" i={5} />
      <Box x={30} y={418} w={260} h={44} label="Export" sub="private fields excluded" accent i={6} />

      <Box x={30} y={484} w={84} h={32} fs={10} label="Batch runs" i={7} />
      <Box x={118} y={484} w={84} h={32} fs={10} label="Cost dashboard" i={8} />
      <Box x={206} y={484} w={84} h={32} fs={10} label="Match quality" i={9} />
      <text x={290} y={538} textAnchor="end" fontSize={9.5} fill="var(--muted-foreground)">
        Workers · D1 · R2
      </text>
    </Frame>
  );
}

function FinanceWide() {
  const m = "arrow-finance-w";
  return (
    <Frame marker={m} title={FINANCE_TITLE} w={640} h={360}>
      <Box x={32} y={70} w={118} h={44} label="Shopify" sub="webhook intake" i={0} />
      <Box x={32} y={126} w={118} h={44} label="Manual entry" sub="DMs · marketplace" i={1} />
      <Arrow marker={m} d="M150 92 H180 V116" i={0} />
      <Arrow marker={m} d="M150 148 H180 V124" i={1} />
      <Arrow marker={m} d="M180 120 H196" i={2} />
      <Box
        x={198}
        y={92}
        w={140}
        h={56}
        label="Ops & Admin book"
        sub="orders · cash · counts"
        accent
        i={2}
      />
      <Arrow marker={m} d="M338 120 H366" i={3} />
      <Box
        x={368}
        y={92}
        w={140}
        h={56}
        label="Remittance & cash"
        sub="COD · rider · gateway"
        i={3}
      />
      <Arrow marker={m} d="M438 148 V178" i={4} />
      <Box
        x={368}
        y={180}
        w={140}
        h={56}
        label="Management view"
        sub="journal · TB · P&L · cash"
        accent
        i={4}
      />
      <Arrow marker={m} d="M508 208 H536" i={5} />
      <Box x={538} y={180} w={70} h={56} label="Gates" sub="must pass" i={5} />
      <Arrow marker={m} d="M573 236 V270 H508" i={6} />
      <Box x={368} y={252} w={140} h={44} label="Monthly rollover" sub="one menu action" i={6} />
      <Arrow marker={m} d="M368 274 H290 V148" i={7} />
      <text x={200} y={286} fontSize={9.5} fill="var(--muted-foreground)">
        carry open orders → next month
      </text>
      <Box x={32} y={252} w={150} h={44} label="Close report" sub="balance-checked PDF" i={7} />
      <text x={608} y={318} textAnchor="end" fontSize={9.5} fill="var(--muted-foreground)">
        Sheets · Apps Script · Python gates
      </text>
    </Frame>
  );
}

/** Stacked variant: the two intakes merge, then the month runs top to bottom. */
function FinanceTall() {
  const m = "arrow-finance-t";
  return (
    <Frame marker={m} title={FINANCE_TITLE} w={320} h={518}>
      <Box x={30} y={46} w={126} h={44} label="Shopify" sub="webhook intake" i={0} />
      <Box x={164} y={46} w={126} h={44} label="Manual entry" sub="DMs · marketplace" i={1} />
      <Arrow marker={m} d="M93 90 V98 H136 V106" i={0} />
      <Arrow marker={m} d="M227 90 V98 H184 V106" i={1} />
      <Box
        x={30}
        y={108}
        w={260}
        h={48}
        label="Ops & Admin book"
        sub="orders · cash · counts"
        accent
        i={2}
      />
      <Arrow marker={m} d="M160 156 V174" i={2} />
      <Box
        x={30}
        y={176}
        w={260}
        h={48}
        label="Remittance & cash"
        sub="COD · rider · gateway"
        i={3}
      />
      <Arrow marker={m} d="M160 224 V242" i={3} />
      <Box
        x={30}
        y={244}
        w={260}
        h={48}
        label="Management view"
        sub="journal · TB · P&L · cash"
        accent
        i={4}
      />
      <Arrow marker={m} d="M160 292 V310" i={4} />
      <Box x={30} y={312} w={260} h={40} label="Gates" sub="must pass" i={5} />
      <Arrow marker={m} d="M160 352 V370" i={5} />
      <Box x={30} y={372} w={260} h={44} label="Close report" sub="balance-checked PDF" i={6} />
      <Arrow marker={m} d="M160 416 V434" i={6} />
      <Box
        x={30}
        y={436}
        w={260}
        h={44}
        label="Monthly rollover"
        sub="carry open orders forward"
        i={7}
      />
      {/* Loop back up the left gutter into the ops book — the month restarts. */}
      <Arrow marker={m} d="M30 458 H14 V132 H28" i={7} />
      <text x={290} y={502} textAnchor="end" fontSize={9.5} fill="var(--muted-foreground)">
        Sheets · Apps Script · Python gates
      </text>
    </Frame>
  );
}

/** Landscape only — used as card media, where the diagram is a thumbnail. */
export function CaseDiagram({ id }: { id: DiagramId }) {
  return id === "pricing" ? <PricingWide /> : <FinanceWide />;
}

/**
 * Case-page figure. Stacked layout below `sm` so the whole flow is readable at
 * 375px without sideways scrolling; landscape from `sm` up.
 *
 * The connectors' draw-in is a CSS transition, not a keyframe animation — see
 * the `.case-figure .flow` rule in globals.css for why. Keep it that way.
 */
export function CaseFigure({ id }: { id: DiagramId }) {
  return (
    <>
      <div className="sm:hidden">{id === "pricing" ? <PricingTall /> : <FinanceTall />}</div>
      <div className="max-sm:hidden">{id === "pricing" ? <PricingWide /> : <FinanceWide />}</div>
    </>
  );
}
