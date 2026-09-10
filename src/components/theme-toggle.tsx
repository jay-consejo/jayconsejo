"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  // true after hydration, false during SSR — avoids a setState-in-effect.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!mounted) {
    return <span className={`inline-block size-11 ${className}`} aria-hidden />;
  }

  const isDark = theme === "dark";
  const next = isDark ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className={`inline-flex size-11 items-center justify-center rounded-full border border-border-subtle text-foreground transition-colors hover:bg-surface ${className}`}
      aria-label={`Switch to ${next} mode`}
    >
      {isDark ? <Moon className="size-5" /> : <Sun className="size-5" />}
    </button>
  );
}
