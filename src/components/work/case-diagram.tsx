type Stagger = { i?: number };
type BoxProps = Stagger & {
  x: number;
  y: number;
  w?: number;
  h?: number;
  label: string;
  sub?: string;
  accent?: boolean;
};

function Box({ x, y, w = 128, h = 52, label, sub, accent, i = 0 }: BoxProps) {
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
        fontSize={12}
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

function Arrow({ d, i = 0 }: Stagger & { d: string }) {
  return (
    <path
      className="flow"
      style={{ "--i": i } as React.CSSProperties}
      d={d}
      fill="none"
      stroke="var(--text-secondary)"
      strokeWidth={1.25}
      strokeOpacity={0.7}
      markerEnd="url(#arrow)"
    />
  );
}

function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 640 360"
      role="img"
      aria-label={title}
      className="block aspect-video w-full bg-surface font-sans"
    >
      <defs>
        <marker
          id="arrow"
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
        x={32}
        y={34}
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

function PricingDiagram() {
  return (
    <Frame title="Intake to approved price">
      <Box x={32} y={90} label="Item + photos" sub="staff intake form" i={0} />
      <Arrow d="M160 116 H188" i={0} />
      <Box x={190} y={90} label="Comps gather" sub="comparable listings" i={1} />
      <Arrow d="M318 116 H346" i={1} />
      <Box x={348} y={90} label="Condition read" sub="from photos only" i={2} />
      <Arrow d="M476 116 H504" i={2} />
      <Box x={506} y={90} w={102} label="Pricing" sub="deterministic" accent i={3} />

      <Arrow d="M557 142 V190 H540" i={3} />
      <Box x={412} y={190} label="Review" sub="comps + photos + price" i={4} />
      <Arrow d="M412 216 H384" i={4} />
      <Box x={254} y={190} label="Approval" sub="separate decision" i={5} />
      <Arrow d="M254 216 H226" i={5} />
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

function FinanceDiagram() {
  return (
    <Frame title="Order to closed month">
      <Box x={32} y={70} w={118} h={44} label="Shopify" sub="webhook intake" i={0} />
      <Box x={32} y={126} w={118} h={44} label="Manual entry" sub="DMs · marketplace" i={1} />
      <Arrow d="M150 92 H180 V116" i={0} />
      <Arrow d="M150 148 H180 V124" i={1} />
      <Arrow d="M180 120 H196" i={2} />
      <Box x={198} y={92} w={140} h={56} label="Ops & Admin book" sub="orders · cash · counts" accent i={2} />
      <Arrow d="M338 120 H366" i={3} />
      <Box x={368} y={92} w={140} h={56} label="Remittance & cash" sub="COD · rider · gateway" i={3} />
      <Arrow d="M438 148 V178" i={4} />
      <Box x={368} y={180} w={140} h={56} label="Management view" sub="journal · TB · P&L · cash" accent i={4} />
      <Arrow d="M508 208 H536" i={5} />
      <Box x={538} y={180} w={70} h={56} label="Gates" sub="must pass" i={5} />
      <Arrow d="M573 236 V270 H508" i={6} />
      <Box x={368} y={252} w={140} h={44} label="Monthly rollover" sub="one menu action" i={6} />
      <Arrow d="M368 274 H290 V148" i={7} />
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

export function CaseDiagram({ id }: { id: "pricing" | "finance" }) {
  return id === "pricing" ? <PricingDiagram /> : <FinanceDiagram />;
}
