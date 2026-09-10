import { WorkCard } from "@/components/work-card";
import { clientWork, productWork } from "@/lib/work";

function Group({ label, items }: { label: string; items: typeof clientWork }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-[0.18em] text-text-secondary uppercase">
        {label}
      </p>
      <div className="mt-5 grid gap-6 md:grid-cols-2">
        {items.map((item) => (
          <WorkCard key={item.slug} item={item} />
        ))}
      </div>
    </div>
  );
}

export function Work() {
  return (
    <section id="projects" className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium tracking-[0.22em] text-accent-gold/80 uppercase">
            Proof
          </p>
          <h2 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Selected Work
          </h2>
          <p className="mt-5 text-lg text-text-secondary">
            Client systems in production, then products I own.
          </p>
        </div>

        <div className="mt-16 space-y-16">
          <Group label="Client systems" items={clientWork} />
          <Group label="Products" items={productWork} />
        </div>
      </div>
    </section>
  );
}
