import Link from "next/link";
import { STATUS_LABEL, formatSpan, toId, type CaseStudy } from "@/lib/work";

function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-border-subtle/80 bg-card/50 p-6 ${className}`}>
      <h2 className="text-[11px] font-semibold tracking-[0.18em] text-accent-gold/85 uppercase">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function CaseRail({ item }: { item: CaseStudy }) {
  const toc = [
    ...(item.sections?.map((s) => s.heading) ?? []),
    ...(item.outcomes ? ["Engineering outcomes"] : []),
    ...(item.notes ? ["Decision notes"] : []),
  ];
  const glance = item.outcomes?.slice(0, 2) ?? [];

  return (
    <aside className="flex flex-col gap-4 lg:sticky lg:top-28 lg:self-start">
      <Card title="On this page" className="hidden lg:block">
        <ul className="-mx-2.5 flex flex-col gap-0.5">
          {toc.map((h) => (
            <li key={h}>
              <a
                href={`#${toId(h)}`}
                data-toc-link
                className="toc-link flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-text-secondary transition-colors hover:text-foreground"
              >
                {h}
              </a>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="At a glance">
        {glance.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {glance.map((o) => (
              <div key={o.label}>
                <div className="font-display text-2xl leading-none text-accent-gold">{o.value}</div>
                <div className="mt-1.5 text-[10px] font-medium tracking-[0.14em] text-text-secondary uppercase">
                  {o.label}
                </div>
              </div>
            ))}
          </div>
        )}
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-1.5 text-[13px]">
          {item.role && (
            <>
              <dt className="text-muted-foreground">Role</dt>
              <dd className="text-foreground">{item.role}</dd>
            </>
          )}
          <dt className="text-muted-foreground">Span</dt>
          <dd className="text-foreground">{formatSpan(item.span)}</dd>
          <dt className="text-muted-foreground">Status</dt>
          <dd className="text-foreground">{STATUS_LABEL[item.status]}</dd>
          {item.runsOn && (
            <>
              <dt className="text-muted-foreground">Runs on</dt>
              <dd className="text-foreground">{item.runsOn}</dd>
            </>
          )}
        </dl>
      </Card>

      <div className="rounded-2xl border border-accent-gold/30 bg-accent-dim/60 p-6">
        <h2 className="text-[11px] font-semibold tracking-[0.18em] text-accent-gold/85 uppercase">
          Need something like this?
        </h2>
        <p className="mt-3 text-sm text-text-secondary">
          Book a short call. My assistant Sofia takes the first one.
        </p>
        <Link
          href="/#contact"
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-accent-gold px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-accent-light hover:shadow-[0_0_24px_var(--accent-dim)]"
        >
          Book a Call
        </Link>
      </div>
    </aside>
  );
}
