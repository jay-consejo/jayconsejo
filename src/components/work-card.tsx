import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CaseDiagram } from "@/components/work/case-diagram";
import type { CaseStudy } from "@/lib/work";

function Media({ item, wide }: { item: CaseStudy; wide: boolean }) {
  const m = item.media;
  if (m.kind === "video") {
    return (
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={m.alt}
        className="aspect-video w-full bg-black object-cover"
      >
        <source src={m.src} type="video/mp4" />
      </video>
    );
  }
  if (m.kind === "svg") {
    return (
      <div
        className={`border-b border-border-subtle/80 ${wide ? "md:flex md:items-center md:border-r md:border-b-0 md:bg-surface" : ""}`}
        aria-label={m.alt}
      >
        <CaseDiagram id={m.diagram} />
      </div>
    );
  }
  return (
    <div
      className="flex aspect-video w-full items-center justify-center text-xs font-medium tracking-[0.2em] text-muted-foreground/70"
      style={{ background: m.gradient }}
    >
      {m.label}
    </div>
  );
}

/** `wide` spans both grid columns from md up, media beside the text instead of above it. */
export function WorkCard({ item, wide = false }: { item: CaseStudy; wide?: boolean }) {
  const href = item.published ? `/work/${item.slug}` : undefined;
  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-2xl border border-border-subtle/80 bg-card/50 transition-all hover:border-accent-gold/40 hover:bg-card ${wide ? "md:col-span-2 md:grid md:grid-cols-2" : ""}`}
    >
      <Media item={item} wide={wide} />
      <div className={`flex flex-1 flex-col p-7 ${wide ? "md:justify-center" : ""}`}>
        <div className="inline-flex w-fit items-center rounded-full border border-accent-gold/30 bg-accent-dim px-3 py-1 text-[11px] font-medium tracking-[0.08em] text-accent-gold uppercase">
          {item.tag}
        </div>
        <h3 className="mt-4 font-display text-2xl font-semibold text-foreground">
          {href ? (
            <Link href={href} className="transition-colors hover:text-accent-gold">
              {item.title}
            </Link>
          ) : (
            item.title
          )}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">{item.oneLiner}</p>
        <div className="mt-5 flex flex-wrap gap-1.5">
          {item.stack.map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-border-subtle bg-surface/60 px-2.5 py-1 text-[10px] font-medium text-muted-foreground"
            >
              {tech}
            </span>
          ))}
        </div>
        {href && (
          <Link
            href={href}
            className="mt-6 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-accent-gold transition-colors hover:text-accent-light"
          >
            Read the case study
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
    </article>
  );
}

/**
 * Two-column grid of work cards. An odd last card spans both columns, so a row
 * never ends half-empty on desktop.
 */
export function WorkGrid({ items }: { items: CaseStudy[] }) {
  const oddOut = items.length > 1 && items.length % 2 === 1;
  return (
    <div className="mt-5 grid gap-6 md:grid-cols-2">
      {items.map((item, i) => (
        <WorkCard key={item.slug} item={item} wide={oddOut && i === items.length - 1} />
      ))}
    </div>
  );
}
