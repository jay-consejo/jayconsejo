const projects = [
  {
    name: "Murmura",
    description:
      "AI video production platform for YouTube creators. Generates scripts, scenes, and video from text prompts.",
    stack: ["Next.js", "AI SDK", "Remotion"],
    status: "In Development",
  },
  {
    name: "Provly",
    description:
      "On-chain campaign verification platform on Base. Proves marketing deliverables with blockchain receipts.",
    stack: ["Next.js", "tRPC", "Solidity", "Base"],
    status: "Near Launch",
  },
  {
    name: "DDN",
    description:
      "AI-powered news digest platform. Curates and summarizes daily news with intelligent categorization.",
    stack: ["Python", "FastAPI", "Supabase"],
    status: "Live",
  },
];

export function Projects() {
  return (
    <section id="projects" className="bg-muted/30 px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          Our Work
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          Real products built through our AI-powered development pipeline.
        </p>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.name}
              className="flex flex-col rounded-xl border border-border/60 bg-card p-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">{project.name}</h3>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  {project.status}
                </span>
              </div>
              <p className="mt-3 flex-1 text-sm text-muted-foreground">
                {project.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {project.stack.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-md border border-border/60 px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
