import { Mail } from "lucide-react";

export const JAY_EMAIL = "consejo.jay@gmail.com";
const MAILTO = `mailto:${JAY_EMAIL}?subject=${encodeURIComponent("Project inquiry")}`;

const steps = ["You email", "Short call", "Project brief"];

/** The contact section while Sofia's call is offline: email instead of a call. */
export function ContactEmail() {
  return (
    <section id="contact" className="relative overflow-hidden px-6 py-24 md:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, rgba(200, 168, 126, 0.10) 0%, transparent 55%)",
        }}
      />
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="text-xs font-medium tracking-[0.22em] text-accent-gold/80 uppercase">
            Let&apos;s Talk
          </p>
          <h2 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Let&apos;s make something real.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-text-secondary">
            Tell me about your project. I reply within 24 hours.
          </p>
        </div>

        <div className="mt-12 rounded-2xl border border-border-subtle/80 bg-card/60 p-8 text-center md:p-10">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent-dim text-accent-gold">
            <Mail className="size-6" aria-hidden />
          </span>
          <p className="mt-5 font-display text-2xl font-semibold break-all text-foreground md:text-3xl">
            {JAY_EMAIL}
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-text-secondary">
            Say what you&apos;re building and when you need it. I&apos;ll reply with a time for a short call. No pitch.
          </p>
          <a
            href={MAILTO}
            className="mt-6 inline-flex h-12 w-full max-w-xs items-center justify-center rounded-full bg-accent-gold px-6 text-sm font-semibold text-primary-foreground transition-all hover:bg-accent-light hover:shadow-[0_0_32px_var(--accent-dim)]"
          >
            Email Jay
          </a>
        </div>

        <ol className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap sm:gap-2">
          {steps.map((step, i) => (
            <li
              key={step}
              className="flex items-center gap-3 text-xs font-medium tracking-[0.08em] text-text-secondary uppercase"
            >
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-accent-gold" aria-hidden />
                {step}
              </span>
              {i < steps.length - 1 && (
                <span className="hidden text-muted-foreground sm:inline" aria-hidden>
                  →
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
