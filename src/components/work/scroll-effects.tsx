"use client";

import { useEffect } from "react";

/**
 * Progressive motion for case-study pages: reveal-on-scroll for [data-reveal]
 * and .case-figure, active-section highlight for [data-toc-link], and a
 * reading-progress bar. Everything degrades to static content without JS.
 */
export function ScrollEffects() {
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>("[data-reveal], .case-figure");
    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("in"));
      return;
    }

    const reveal = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            reveal.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );
    targets.forEach((el) => reveal.observe(el));

    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("[data-toc-link]"));
    const sections = links
      .map((a) => document.getElementById(a.getAttribute("href")?.slice(1) ?? ""))
      .filter((s): s is HTMLElement => s !== null);
    const spy = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          for (const l of links) {
            const active = l.getAttribute("href") === `#${e.target.id}`;
            if (active) l.setAttribute("aria-current", "true");
            else l.removeAttribute("aria-current");
          }
        }
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    sections.forEach((s) => spy.observe(s));

    const bar = document.getElementById("reading-progress");
    const onScroll = () => {
      if (!bar) return;
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      bar.style.width = max > 0 ? `${(h.scrollTop / max) * 100}%` : "0%";
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      reveal.disconnect();
      spy.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div
      id="reading-progress"
      aria-hidden
      className="fixed top-20 left-0 z-[51] h-0.5 w-0 transition-[width] duration-100 ease-linear"
      style={{ background: "linear-gradient(90deg, var(--accent-gold), var(--accent-light))" }}
    />
  );
}
