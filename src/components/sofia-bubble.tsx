"use client";

import { useEffect, useState } from "react";
import { Mic } from "lucide-react";
import { useSofiaState } from "@/components/sofia-state";

export function SofiaBubble() {
  const { status } = useSofiaState();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const contact = document.getElementById("contact");
    if (!contact) return;
    const observer = new IntersectionObserver(
      (entries) => setHidden(entries[0]?.isIntersecting ?? false),
      { rootMargin: "-20% 0px -20% 0px" },
    );
    observer.observe(contact);
    return () => observer.disconnect();
  }, []);

  if (status === "locked" || status === "already_contacted") {
    return null;
  }

  function openContact() {
    const contact = document.getElementById("contact");
    if (!contact) return;
    contact.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      const nameInput = document.getElementById("name") as HTMLInputElement | null;
      nameInput?.focus({ preventScroll: true });
    }, 600);
  }

  return (
    <button
      type="button"
      onClick={openContact}
      aria-label="Talk to Sofia, Jay's AI Executive Assistant"
      data-hidden={hidden || undefined}
      className="group fixed right-5 bottom-5 z-50 inline-flex size-14 items-center justify-center rounded-full bg-accent-gold text-primary-foreground shadow-lg shadow-black/20 transition-all hover:bg-accent-light hover:shadow-[0_0_32px_var(--accent-dim)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[hidden]:pointer-events-none data-[hidden]:translate-y-3 data-[hidden]:opacity-0 md:right-8 md:bottom-8"
    >
      <span
        aria-hidden
        className="absolute inset-0 rounded-full bg-accent-gold opacity-40 transition-all group-hover:opacity-0 motion-safe:animate-ping"
      />
      <Mic className="relative size-6" />
      <span className="sr-only">Talk to Sofia</span>
    </button>
  );
}
