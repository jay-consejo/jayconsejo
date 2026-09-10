import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

const suffixes = [
  "actually work.",
  "save 20+ hours a week.",
  "ship in weeks, not quarters.",
  "turn into revenue.",
];
const longestSuffix = suffixes.reduce((a, b) => (b.length > a.length ? b : a));

export function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[92vh] items-center justify-center overflow-hidden px-6 pt-28 pb-20"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at 50% 20%, rgba(200, 168, 126, 0.12) 0%, transparent 55%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.015]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="mx-auto w-full max-w-4xl text-center">
        <p className="mb-5 text-xs font-medium tracking-[0.14em] text-accent-gold/80 uppercase sm:text-sm sm:tracking-[0.18em]">
          {siteConfig.name} · AI, Web &amp; Systems Builder
        </p>
        <h1 className="font-display text-[2rem] font-semibold leading-[1.15] tracking-tight text-balance text-foreground sm:text-5xl md:text-6xl lg:text-[4rem]">
          AI, web apps, and systems that{" "}
          <span className="cycle-wrap font-display italic text-accent-gold">
            <span className="cycle-sizer" aria-hidden="true">
              {longestSuffix}
            </span>
            {suffixes.map((text, i) => (
              <span key={text} className={`cycle-item cycle-${i + 1}`}>
                {text}
              </span>
            ))}
          </span>
        </h1>
        <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-text-secondary sm:mt-8 sm:text-lg md:text-xl">
          Internal tools, finance &amp; ops systems, and AI products — built end-to-end by one builder and an {siteConfig.stats.agents}-agent team. {siteConfig.stats.clientSystems} client systems in production, {siteConfig.stats.products} products shipped.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href="#projects"
            className="inline-flex items-center justify-center rounded-full bg-accent-gold px-7 py-3.5 text-base font-semibold text-primary-foreground transition-all hover:bg-accent-light hover:shadow-[0_0_32px_var(--accent-dim)]"
          >
            See the Work
          </Link>
          <Link
            href="#contact"
            className="inline-flex items-center justify-center rounded-full border border-accent-gold/40 px-7 py-3.5 text-base font-semibold text-accent-gold transition-all hover:border-accent-gold hover:bg-accent-dim"
          >
            Book a Call
          </Link>
        </div>
      </div>
    </section>
  );
}
