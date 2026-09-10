import Image from "next/image";

const skills = [
  { label: "AI / LLMs", highlight: true },
  { label: "Next.js", highlight: true },
  { label: "Google Apps Script", highlight: true },
  { label: "Web3", highlight: true },
  { label: "React", highlight: false },
  { label: "TypeScript", highlight: false },
  { label: "Python", highlight: false },
  { label: "Solidity", highlight: false },
  { label: "Cloudflare Workers", highlight: false },
  { label: "D1 / SQLite", highlight: false },
  { label: "Drizzle", highlight: false },
  { label: "Playwright", highlight: false },
  { label: "Shopify APIs", highlight: false },
  { label: "Vercel AI SDK", highlight: false },
  { label: "Anthropic", highlight: false },
  { label: "Supabase", highlight: false },
  { label: "PostgreSQL", highlight: false },
  { label: "Tailwind CSS", highlight: false },
  { label: "tRPC", highlight: false },
  { label: "n8n", highlight: false },
  { label: "Vercel", highlight: false },
  { label: "Railway", highlight: false },
  { label: "Cloudflare", highlight: false },
];

export function About() {
  return (
    <section id="about" className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-start gap-12 md:grid-cols-[280px_1fr] md:gap-16">
          <div className="relative mx-auto aspect-[280/340] w-full max-w-[280px] overflow-hidden rounded-2xl border border-border-subtle md:mx-0">
            <Image
              src="/assets/portraits/jay-formal.jpg"
              alt="Jay Consejo"
              fill
              sizes="(min-width: 768px) 280px, 100vw"
              priority
              className="object-cover"
            />
          </div>

          <div>
            <p className="text-xs font-medium tracking-[0.22em] text-accent-gold/80 uppercase">
              About
            </p>
            <h2 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
              The short version
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-text-secondary">
              Full-stack builder and AI-first founder. Years in Web3 events, marketing, and partnerships — The BLOKC, Hiraya Network, Superteam PH — before going all-in on AI software.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              No CS background. Business route — BBA from PUP, years running marketing in Web3. I build products that make business sense, not science projects — and I&apos;m as comfortable inside a chart of accounts as inside a codebase.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {skills.map((s) => (
                <span
                  key={s.label}
                  className={
                    s.highlight
                      ? "rounded-full border border-accent-gold/40 bg-accent-dim px-3 py-1.5 text-xs font-medium text-accent-gold"
                      : "rounded-full border border-border-subtle bg-surface/60 px-3 py-1.5 text-xs font-medium text-text-secondary"
                  }
                >
                  {s.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
