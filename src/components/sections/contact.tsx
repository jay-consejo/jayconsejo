"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

export function Contact() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO: Wire up form submission (Formspree, Vercel, etc.)
    setSubmitted(true);
  }

  return (
    <section id="contact" className="bg-muted/30 px-6 py-20">
      <div className="mx-auto max-w-xl">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          Get in Touch
        </h2>
        <p className="mt-4 text-center text-muted-foreground">
          Have a project in mind? Let&apos;s talk about how we can help.
        </p>

        {submitted ? (
          <div className="mt-8 rounded-xl border border-border/60 bg-card p-8 text-center">
            <p className="text-lg font-medium">Thank you!</p>
            <p className="mt-2 text-sm text-muted-foreground">
              We&apos;ll get back to you soon.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-1.5 flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              />
            </div>
            <div>
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1.5 flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              />
            </div>
            <div>
              <label htmlFor="message" className="text-sm font-medium">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                required
                className="mt-1.5 flex w-full rounded-lg border border-border bg-background px-3 py-2 text-sm transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              />
            </div>
            <Button type="submit" size="lg" className="w-full">
              Send Message
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
