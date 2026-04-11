import { buttonVariants } from "@/components/ui/button";

export function Hero() {
  return (
    <section
      id="hero"
      className="flex min-h-[80vh] items-center justify-center px-6 pt-16"
    >
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Software Built Smarter
          <br />
          <span className="text-muted-foreground">with AI-Driven Teams</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          From idea to production — AI-powered development that delivers modern,
          scalable applications for startups and growing businesses.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a href="#contact" className={buttonVariants({ size: "lg" })}>
            Get in Touch
          </a>
          <a
            href="#projects"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            See Our Work
          </a>
        </div>
      </div>
    </section>
  );
}
