import { siteConfig } from "@/lib/site-config";

const steps = [
  {
    num: "01",
    title: "Discover",
    body: "Define the problem and what \"done\" looks like. My AI Assistant runs the initial call.",
  },
  {
    num: "02",
    title: "Architect",
    body: "System design. Right stack. Cost-optimized with AI cascades.",
  },
  {
    num: "03",
    title: "Build",
    body: `Ship fast. ${siteConfig.stats.agents} agents handle code, review, and deploy.`,
  },
  {
    num: "04",
    title: "Deliver",
    body: "Production-ready. Security-hardened. Documented. Deployed on Vercel, Cloudflare, or Railway — or inside your Google Workspace when Sheets is the right tool.",
  },
];

export function Process() {
  return (
    <section
      id="process"
      className="px-6 py-24 md:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium tracking-[0.22em] text-accent-gold/80 uppercase">
            How I Work
          </p>
          <h2 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl">
            From Idea to Production
          </h2>
          <p className="mt-5 text-lg text-text-secondary">
            A clear, no-BS process. How six products and two client systems shipped.
          </p>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div
              key={step.num}
              className="group relative rounded-2xl border border-border-subtle/80 bg-card/50 p-7 transition-colors hover:border-accent-gold/40 hover:bg-card"
            >
              <span className="font-display text-4xl font-semibold text-accent-gold/70 transition-colors group-hover:text-accent-gold">
                {step.num}
              </span>
              <h3 className="mt-4 font-display text-xl font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
