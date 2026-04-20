import Image from "next/image";

const R2 = "https://pub-f0ac1ec148884b718fc28632174966a4.r2.dev";

const portraits = [
  {
    src: "/assets/portraits/jay-blokc.webp",
    alt: "Jay Consejo wearing a BLOKC t-shirt at a co-working space",
    title: "Web3 Community",
    caption: "The BLOKC · Hiraya Network · Superteam PH",
  },
  {
    src: "/assets/portraits/jay-solana.webp",
    alt: "Jay Consejo speaking with a microphone at a Solana event",
    title: "Solana Ecosystem",
    caption: "Organizer · Solana PH events",
  },
];

export function TrackRecord() {
  return (
    <section id="track-record" className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium tracking-[0.22em] text-accent-gold/80 uppercase">
            Track Record
          </p>
          <h2 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Real engagements,
            <br />
            in tech since 2021
          </h2>
          <p className="mt-5 text-base leading-relaxed text-text-secondary">
            Builder by default — community, hackathons, and the speaker circuit on the side.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {portraits.map((p) => (
            <figure
              key={p.src}
              className="group overflow-hidden rounded-2xl border border-border-subtle/80 bg-card/50 transition-all hover:border-accent-gold/40 hover:bg-card"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden">
                <Image
                  src={p.src}
                  alt={p.alt}
                  fill
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>
              <figcaption className="p-6">
                <p className="font-display text-lg font-semibold text-foreground">
                  {p.title}
                </p>
                <p className="mt-1 text-sm text-text-secondary">{p.caption}</p>
              </figcaption>
            </figure>
          ))}
        </div>

        <figure className="mt-10 overflow-hidden rounded-2xl border border-border-subtle/80 bg-card/50">
          <video
            controls
            playsInline
            preload="metadata"
            poster={`${R2}/bcc-2025-poster.jpg`}
            className="aspect-video w-full bg-black"
          >
            <source src={`${R2}/bcc-2025-event.mp4`} type="video/mp4" />
            Sorry, your browser doesn&apos;t support embedded videos.
          </video>
          <figcaption className="flex flex-col gap-2 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-lg font-semibold text-foreground">
                Blockchain Campus Conference
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                Led as Head of BCC. Brought Web3 education to students across Luzon, Visayas, and Mindanao.
              </p>
            </div>
            <span className="inline-flex w-fit items-center rounded-full border border-accent-gold/30 bg-accent-dim px-3 py-1 text-[11px] font-medium tracking-[0.08em] text-accent-gold uppercase">
              Event recap · 1:16
            </span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
