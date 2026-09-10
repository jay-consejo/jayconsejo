import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CaseDiagram } from "@/components/work/case-diagram";
import { STATUS_LABEL, formatSpan, getCase, publishedWork } from "@/lib/work";
import { siteConfig } from "@/lib/site-config";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return publishedWork.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = getCase(slug);
  if (!item) return {};
  return {
    title: item.title,
    description: item.oneLiner,
    alternates: { canonical: `${siteConfig.url}/work/${item.slug}` },
    openGraph: {
      title: `${item.title} — ${siteConfig.name}`,
      description: item.oneLiner,
      url: `${siteConfig.url}/work/${item.slug}`,
      type: "article",
    },
  };
}

export default async function CasePage({ params }: Props) {
  const { slug } = await params;
  const item = getCase(slug);
  if (!item) notFound();

  const schema = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: item.title,
    description: item.oneLiner,
    url: `${siteConfig.url}/work/${item.slug}`,
    author: { "@type": "Person", name: siteConfig.name, url: siteConfig.url },
    dateCreated: `${item.span.from}-01`,
    keywords: item.stack.join(", "),
  };

  return (
    <article className="px-6 pt-32 pb-24 md:pb-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div className="mx-auto max-w-6xl">
        <Link
          href="/work"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          All work
        </Link>

        <header className="mt-6 max-w-3xl">
          <div className="inline-flex items-center rounded-full border border-accent-gold/30 bg-accent-dim px-3 py-1 text-[11px] font-medium tracking-[0.08em] text-accent-gold uppercase">
            {item.tag}
          </div>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl">
            {item.title}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-text-secondary sm:text-xl">
            {item.oneLiner}
          </p>
          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Span</dt>
              <dd className="text-foreground">{formatSpan(item.span)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="text-foreground">{STATUS_LABEL[item.status]}</dd>
            </div>
          </dl>
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
        </header>

        {item.media.kind === "svg" && (
          <figure className="mt-12 overflow-x-auto rounded-2xl border border-border-subtle/80">
            {/* Below sm the diagram keeps a readable width and scrolls sideways. */}
            <div className="min-w-[600px] sm:min-w-0">
              <CaseDiagram id={item.media.diagram} />
            </div>
          </figure>
        )}

        {item.summary && (
          <p className="mt-12 max-w-3xl font-display text-xl leading-relaxed text-foreground sm:text-2xl">
            {item.summary}
          </p>
        )}

        <div className="mt-12 max-w-3xl space-y-12">
          {item.sections?.map((s) => (
            <section key={s.heading}>
              <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
                {s.heading}
              </h2>
              <div className="mt-4 space-y-4">
                {s.body.map((p, i) => (
                  <p key={i} className="text-base leading-relaxed text-text-secondary">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {item.outcomes && (
          <section className="mt-16">
            <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
              Engineering outcomes
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              {item.outcomes.map((o) => (
                <div
                  key={o.label}
                  className="rounded-2xl border border-border-subtle/80 bg-card/50 p-6 text-center"
                >
                  <div className="font-display text-3xl font-semibold text-accent-gold md:text-4xl">
                    {o.value}
                  </div>
                  <div className="mt-2 text-xs font-medium tracking-[0.12em] text-text-secondary uppercase">
                    {o.label}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {item.notes && (
          <section className="mt-16">
            <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
              Decision notes
            </h2>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {item.notes.map((n) => (
                <div
                  key={n.title}
                  className="rounded-2xl border border-border-subtle/80 bg-card/50 p-6"
                >
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {n.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">{n.body}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mt-20 rounded-2xl border border-accent-gold/30 bg-accent-dim/60 p-8 text-center md:p-12">
          <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
            Need something like this?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-text-secondary">
            Book a short call. My assistant Sofia takes the first one.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/#contact"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent-gold px-7 py-3 text-base font-semibold text-primary-foreground transition-all hover:bg-accent-light hover:shadow-[0_0_32px_var(--accent-dim)]"
            >
              Book a Call
            </Link>
            <Link
              href="/work"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-accent-gold/40 px-7 py-3 text-base font-semibold text-accent-gold transition-all hover:border-accent-gold hover:bg-accent-dim"
            >
              Back to Work
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
