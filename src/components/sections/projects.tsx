const R2 = "https://pub-f0ac1ec148884b718fc28632174966a4.r2.dev";

type Project = {
  tag: string;
  title: string;
  body: string;
  stack: string[];
  gradient: string;
  label: string;
  video?: string;
};

const projects: Project[] = [
  {
    tag: "AI Video Production",
    title: "Murmura Studio",
    body: "AI video production for YouTube. Automates research, scripting, voiceover, rendering, publishing.",
    stack: ["Next.js 16", "AI SDK", "Anthropic", "Remotion", "ElevenLabs"],
    gradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
    label: "MURMURA STUDIO",
    video: `${R2}/murmura-ad-final.mp4`,
  },
  {
    tag: "AI News Platform",
    title: "Decoded Daily News",
    body: "Personalized daily news for professionals. 40+ sources, multi-step summarization, delivered 6 AM. Gemini→Vertex→Groq→Claude cascade keeps cost low.",
    stack: ["Python", "FastAPI", "Supabase", "Multi-LLM", "SendGrid"],
    gradient: "linear-gradient(135deg, #2d1b4e 0%, #1a1a2e 100%)",
    label: "DECODED DAILY NEWS",
  },
  {
    tag: "Web3 Campaign Platform",
    title: "Provly",
    body: "On-chain campaign verification on Base. Brands post campaigns, creators submit proof, smart contracts pay out with ECDSA verification.",
    stack: ["Next.js 14", "Solidity", "Base", "tRPC", "Wagmi"],
    gradient: "linear-gradient(135deg, #1a2e1a 0%, #1a1a2e 100%)",
    label: "PROVLY",
  },
  {
    tag: "AI Agency Orchestration",
    title: "Hybrid AI Dev Pipeline",
    body: "Self-hosted AI dev agency. 19 agents across 3 teams, orchestrated via Slack + n8n + Claude. Mac/PC hybrid for local inference.",
    stack: ["n8n", "Claude", "Ollama", "Slack", "19 Agents"],
    gradient: "linear-gradient(135deg, #2e1a1a 0%, #1a1a2e 100%)",
    label: "HYBRID AI DEV PIPELINE",
  },
];

export function Projects() {
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
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {projects.map((p) => (
            <article
              key={p.title}
              className="group overflow-hidden rounded-2xl border border-border-subtle/80 bg-card/50 transition-all hover:border-accent-gold/40 hover:bg-card"
            >
              {p.video ? (
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-label={`${p.title} showreel`}
                  className="h-48 w-full object-cover md:aspect-video md:h-auto"
                >
                  <source src={p.video} type="video/mp4" />
                </video>
              ) : (
                <div
                  className="flex h-48 items-center justify-center text-xs font-medium tracking-[0.2em] text-muted-foreground/70 md:aspect-video md:h-auto"
                  style={{ background: p.gradient }}
                >
                  {p.label}
                </div>
              )}
              <div className="p-7">
                <div className="inline-flex items-center rounded-full border border-accent-gold/30 bg-accent-dim px-3 py-1 text-[11px] font-medium tracking-[0.08em] text-accent-gold uppercase">
                  {p.tag}
                </div>
                <h3 className="mt-4 font-display text-2xl font-semibold text-foreground">
                  {p.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                  {p.body}
                </p>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {p.stack.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full border border-border-subtle bg-surface/60 px-2.5 py-1 text-[10px] font-medium text-muted-foreground"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
