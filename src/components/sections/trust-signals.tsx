const stats = [
  { number: "4", label: "Products Shipped" },
  { number: "19", label: "AI Agents Built" },
  { number: "Web3·AI·Web", label: "Full Stack" },
  { number: "Weeks", label: "Not Quarters" },
];

export function TrustSignals() {
  return (
    <section
      id="trust-signals"
      aria-label="Trust signals"
      className="border-y border-border-subtle/60 bg-card/40 px-6 py-14"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 md:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex flex-col items-center text-center"
          >
            <div className="font-display text-3xl font-semibold text-accent-gold md:text-4xl lg:text-5xl">
              {s.number}
            </div>
            <div className="mt-2 text-xs font-medium tracking-[0.14em] text-text-secondary uppercase">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
