"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 z-50 w-full border-b border-border-subtle/60 bg-background/75 backdrop-blur-md">
      <nav className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="font-display text-2xl font-semibold tracking-tight text-accent-gold"
        >
          {siteConfig.logo}
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-10 md:flex">
          {siteConfig.nav.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="text-sm font-medium text-text-secondary transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href={siteConfig.ctaHref}
              className="inline-flex items-center rounded-full bg-accent-gold px-5 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-accent-light hover:shadow-[0_0_24px_var(--accent-dim)]"
            >
              {siteConfig.ctaLabel}
            </a>
          </li>
        </ul>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="-mr-3 inline-flex size-11 items-center justify-center text-foreground md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div
          id="mobile-menu"
          className="border-t border-border-subtle/60 bg-background px-6 py-6 md:hidden"
        >
          <ul className="flex flex-col gap-5">
            {siteConfig.nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="text-base font-medium text-text-secondary transition-colors hover:text-foreground"
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li className="pt-2">
              <a
                href={siteConfig.ctaHref}
                onClick={() => setOpen(false)}
                className="inline-flex items-center rounded-full bg-accent-gold px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                {siteConfig.ctaLabel}
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
