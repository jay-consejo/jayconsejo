import { Code, Cpu, Globe, Zap } from "lucide-react";

const services = [
  {
    icon: Cpu,
    title: "AI-Powered Development",
    description:
      "Full-stack applications built using specialized AI agent teams that code, review, and test — delivering faster with higher quality.",
  },
  {
    icon: Zap,
    title: "MVP & Prototypes",
    description:
      "Rapid prototyping for startups and entrepreneurs. Go from idea to working product in weeks, not months.",
  },
  {
    icon: Globe,
    title: "Web Applications",
    description:
      "Modern, performant web apps with Next.js and React. Responsive, accessible, and optimized for growth.",
  },
  {
    icon: Code,
    title: "AI Integration",
    description:
      "Add AI capabilities to existing products — chatbots, content generation, intelligent automation, and more.",
  },
];

export function Services() {
  return (
    <section id="services" className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          What We Build
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          End-to-end development powered by AI agent teams, managed by humans.
        </p>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <div
              key={service.title}
              className="rounded-xl border border-border/60 bg-card p-6 transition-colors hover:bg-muted/50"
            >
              <service.icon className="size-8 text-foreground" />
              <h3 className="mt-4 text-lg font-semibold">{service.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
