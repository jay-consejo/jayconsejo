import type { Metadata } from "next";
import Link from "next/link";
import { WorkCard } from "@/components/work-card";
import { clientWork, productWork } from "@/lib/work";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Client systems in production and products shipped end-to-end — internal tools, finance & ops systems, and AI products by Jay Consejo.",
  alternates: { canonical: `${siteConfig.url}/work` },
};

export default function WorkIndexPage() {
  return (
    <div className="px-6 pt-32 pb-24 md:pb-32">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-xs font-medium tracking-[0.22em] text-accent-gold/80 uppercase">
            Work
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
            Systems that ship, then keep running.
          </h1>
          <p className="mt-5 text-lg text-text-secondary">
            Client engagements are written up without names or numbers — the
            problem, what got built, and how it stays correct. Products are mine.
          </p>
        </div>

        <div className="mt-16 space-y-16">
          <div>
            <p className="text-xs font-medium tracking-[0.18em] text-text-secondary uppercase">
              Client systems
            </p>
            <div className="mt-5 grid gap-6 md:grid-cols-2">
              {clientWork.map((item) => (
                <WorkCard key={item.slug} item={item} />
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium tracking-[0.18em] text-text-secondary uppercase">
              Products
            </p>
            <div className="mt-5 grid gap-6 md:grid-cols-2">
              {productWork.map((item) => (
                <WorkCard key={item.slug} item={item} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-20 rounded-2xl border border-accent-gold/30 bg-accent-dim/60 p-8 text-center md:p-12">
          <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
            Need something like this?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-text-secondary">
            Book a short call. My assistant Sofia takes the first one.
          </p>
          <Link
            href="/#contact"
            className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-accent-gold px-7 py-3 text-base font-semibold text-primary-foreground transition-all hover:bg-accent-light hover:shadow-[0_0_32px_var(--accent-dim)]"
          >
            Book a Call
          </Link>
        </div>
      </div>
    </div>
  );
}
